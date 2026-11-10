import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Package,
  ShoppingCart,
  Star,
  Truck,
  Users,
} from "lucide-react";
import {
  getDashboardMetrics,
  getLowStockProducts,
  getRecentActivity,
  getRecentOrders,
  getRevenueSeries,
  getTopProducts,
} from "@/lib/admin";
import { StatCard, RevenueChart } from "@/components/admin/stat-card";
import { StatusPill } from "@/components/ui/badge";
import { ProductImage } from "@/components/ui/product-image";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/constants";
import { formatDate, formatMoney, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [metrics, series, orders, activity, topProducts, lowStock] = await Promise.all([
    getDashboardMetrics(),
    getRevenueSeries(14),
    getRecentOrders(6),
    getRecentActivity(8),
    getTopProducts(5),
    getLowStockProducts(5),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black tracking-tight text-fg">Dashboard</h1>
        <p className="mt-1 text-xs text-fg-muted">
          Live figures from the production database — revenue, orders and stock health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={formatMoney(metrics.revenueToday)}
          hint={`${metrics.ordersToday} order${metrics.ordersToday === 1 ? "" : "s"} placed`}
        />
        <StatCard
          label="Revenue this month"
          value={formatMoney(metrics.revenueMonth)}
          hint={`${formatMoney(metrics.revenueTotal)} all time`}
          href="/admin/orders"
        />
        <StatCard
          label="Orders to process"
          value={metrics.ordersPending}
          hint={metrics.disputed > 0 ? `${metrics.disputed} disputed` : "No disputes"}
          hintTone={metrics.disputed > 0 ? "danger" : "success"}
          href="/admin/orders?status=active"
        />
        <StatCard
          label="Average order value"
          value={formatMoney(metrics.avgOrderValue)}
          hint={`${metrics.ordersTotal} orders total`}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={metrics.customers} href="/admin/customers" />
        <StatCard
          label="Low stock"
          value={metrics.lowStock}
          hint="At or below threshold"
          hintTone={metrics.lowStock > 0 ? "warning" : "success"}
          href="/admin/inventory"
        />
        <StatCard
          label="Reviews pending"
          value={metrics.pendingReviews}
          hint="Awaiting moderation"
          hintTone={metrics.pendingReviews > 0 ? "warning" : "muted"}
          href="/admin/reviews"
        />
        <StatCard
          label="Orders per 100 views"
          value={`${metrics.conversionProxy}`}
          hint="Interest proxy, not analytics"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="panel min-w-0 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">Revenue, last 14 days</h2>
            <span className="text-[10px] font-semibold text-fg-subtle">Excludes cancelled</span>
          </div>
          <div className="mt-4">
            <RevenueChart data={series} />
          </div>
        </div>

        <div className="panel min-w-0 p-5">
          <h2 className="text-sm font-bold text-fg">Recent activity</h2>
          <ul className="mt-3 space-y-2.5">
            {activity.length === 0 ? (
              <li className="text-xs text-fg-subtle">No activity recorded yet.</li>
            ) : (
              activity.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-fg">{item.message}</p>
                    <p className="text-[10px] text-fg-subtle">
                      <Link href={`/admin/orders/${item.orderId}`} className="hover:text-brand">
                        {item.orderNumber}
                      </Link>{" "}
                      · {relativeTime(item.createdAt)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="panel min-w-0 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <ShoppingCart className="size-4 text-brand" aria-hidden /> Latest orders
            </h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
            >
              All orders <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-fg-subtle">
                  <th className="pb-2 font-bold">Order</th>
                  <th className="pb-2 font-bold">Customer</th>
                  <th className="pb-2 font-bold">Total</th>
                  <th className="pb-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-fg hover:text-brand"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-[10px] text-fg-subtle">{formatDate(order.placedAt)}</p>
                    </td>
                    <td className="max-w-32 truncate py-2 text-fg-muted">{order.email}</td>
                    <td className="py-2 font-semibold text-fg">{formatMoney(order.total)}</td>
                    <td className="py-2">
                      <StatusPill className={STATUS_TONES[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel min-w-0 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <Package className="size-4 text-brand" aria-hidden /> Top sellers
            </h2>
            <ul className="mt-3 space-y-2.5">
              {topProducts.map((product) => (
                <li key={product.id} className="flex items-center gap-2.5">
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-bg-muted">
                    <ProductImage src={product.images[0]} alt={product.name} sizes="36px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products?q=${encodeURIComponent(product.name)}`}
                      className="block truncate text-[11px] font-semibold text-fg hover:text-brand"
                    >
                      {product.name}
                    </Link>
                    <p className="text-[10px] text-fg-subtle">
                      {product.soldCount} sold · {product.stock} in stock
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-fg">
                    {formatMoney(product.price)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel min-w-0 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <AlertTriangle className="size-4 text-warning" aria-hidden /> Reorder soon
            </h2>
            {lowStock.length === 0 ? (
              <p className="mt-2 text-xs text-fg-subtle">
                Every active product is sufficiently stocked.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {lowStock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate text-fg-muted">{product.name}</span>
                    <span className="shrink-0 font-bold text-warning">
                      {product.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/inventory"
              className="mt-3 inline-block text-[11px] font-semibold text-brand hover:underline"
            >
              Manage inventory →
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/admin/products" className="panel flex items-center gap-3 p-4 hover:border-brand">
          <Package className="size-4 text-brand" aria-hidden />
          <span className="text-xs font-semibold text-fg">Add a product</span>
        </Link>
        <Link href="/admin/coupons" className="panel flex items-center gap-3 p-4 hover:border-brand">
          <Star className="size-4 text-brand" aria-hidden />
          <span className="text-xs font-semibold text-fg">Create a coupon</span>
        </Link>
        <Link href="/admin/shipping" className="panel flex items-center gap-3 p-4 hover:border-brand">
          <Truck className="size-4 text-brand" aria-hidden />
          <span className="text-xs font-semibold text-fg">Shipping plans</span>
        </Link>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-[10px] text-fg-subtle">
        <Users className="size-3" aria-hidden />
        All administrative actions are recorded in the audit log.
      </p>
    </div>
  );
}
