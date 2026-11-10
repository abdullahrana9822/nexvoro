import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orders, products, reviews, users } from "@/db/schema";
import { desc, eq, gte, and } from "drizzle-orm";

export type DashboardMetrics = {
  revenueToday: number;
  revenueMonth: number;
  revenueTotal: number;
  ordersToday: number;
  ordersPending: number;
  ordersTotal: number;
  customers: number;
  lowStock: number;
  pendingReviews: number;
  disputed: number;
  avgOrderValue: number;
  conversionProxy: number;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totals] = await db
    .select({
      revenueTotal: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'CANCELLED'), 0)`,
      revenueToday: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.placedAt} >= ${startOfDay.toISOString()} and ${orders.status} <> 'CANCELLED'), 0)`,
      revenueMonth: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.placedAt} >= ${startOfMonth.toISOString()} and ${orders.status} <> 'CANCELLED'), 0)`,
      ordersToday: sql<number>`count(*) filter (where ${orders.placedAt} >= ${startOfDay.toISOString()})::int`,
      ordersTotal: sql<number>`count(*)::int`,
      ordersPending: sql<number>`count(*) filter (where ${orders.status} in ('PENDING','CONFIRMED','PROCESSING','PACKED'))::int`,
      disputed: sql<number>`count(*) filter (where ${orders.status} = 'DISPUTED')::int`,
      avgOrderValue: sql<string>`coalesce(avg(${orders.total}) filter (where ${orders.status} <> 'CANCELLED'), 0)`,
    })
    .from(orders);

  const [customerRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "CUSTOMER"));

  const [stockRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(
      and(
        eq(products.status, "ACTIVE"),
        sql`${products.stock} <= ${products.lowStockThreshold}`,
      ),
    );

  const [reviewRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.status, "PENDING"));

  const [viewRow] = await db
    .select({ views: sql<number>`coalesce(sum(${products.viewCount}), 0)::int` })
    .from(products);

  const ordersTotal = totals?.ordersTotal ?? 0;
  const views = viewRow?.views ?? 0;

  return {
    revenueToday: Number(totals?.revenueToday ?? 0),
    revenueMonth: Number(totals?.revenueMonth ?? 0),
    revenueTotal: Number(totals?.revenueTotal ?? 0),
    ordersToday: totals?.ordersToday ?? 0,
    ordersPending: totals?.ordersPending ?? 0,
    ordersTotal,
    customers: customerRow?.total ?? 0,
    lowStock: stockRow?.total ?? 0,
    pendingReviews: reviewRow?.total ?? 0,
    disputed: totals?.disputed ?? 0,
    avgOrderValue: Number(totals?.avgOrderValue ?? 0),
    // Orders per 100 product views — an honest, clearly-labelled proxy.
    conversionProxy: views > 0 ? Math.round((ordersTotal / views) * 10000) / 100 : 0,
  };
}

export async function getRevenueSeries(days = 14) {
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.placedAt}), 'YYYY-MM-DD')`,
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.placedAt, since),
        sql`${orders.status} <> 'CANCELLED'`,
      ),
    )
    .groupBy(sql`date_trunc('day', ${orders.placedAt})`)
    .orderBy(sql`date_trunc('day', ${orders.placedAt})`);

  const map = new Map(rows.map((row) => [row.day, row]));
  const series: { day: string; label: string; revenue: number; count: number }[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    const row = map.get(key);
    series.push({
      day: key,
      label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date),
      revenue: Number(row?.revenue ?? 0),
      count: row?.count ?? 0,
    });
  }
  return series;
}

export async function getRecentOrders(limit = 8) {
  return db.select().from(orders).orderBy(desc(orders.placedAt)).limit(limit);
}

export async function getRecentActivity(limit = 12) {
  return db
    .select({
      id: orderEvents.id,
      message: orderEvents.message,
      type: orderEvents.type,
      createdAt: orderEvents.createdAt,
      actorType: orderEvents.actorType,
      orderNumber: orders.orderNumber,
      orderId: orders.id,
    })
    .from(orderEvents)
    .innerJoin(orders, eq(orders.id, orderEvents.orderId))
    .orderBy(desc(orderEvents.createdAt))
    .limit(limit);
}

export async function getTopProducts(limit = 5) {
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      soldCount: products.soldCount,
      stock: products.stock,
      images: products.images,
    })
    .from(products)
    .where(eq(products.status, "ACTIVE"))
    .orderBy(desc(products.soldCount))
    .limit(limit);
}

export async function getLowStockProducts(limit = 8) {
  return db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      stock: products.stock,
      lowStockThreshold: products.lowStockThreshold,
      images: products.images,
    })
    .from(products)
    .where(
      and(
        eq(products.status, "ACTIVE"),
        sql`${products.stock} <= ${products.lowStockThreshold}`,
      ),
    )
    .orderBy(products.stock)
    .limit(limit);
}
