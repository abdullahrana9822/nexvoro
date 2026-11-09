import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  cartItems,
  carts,
  coupons,
  orderEvents,
  orderItems,
  orders,
  payments,
  productVariants,
  products,
  shippingPlans,
  users,
  type Order,
  type OrderStatus,
  type ShippingPlan,
} from "@/db/schema";
import { computeTotals, MAX_AUTOMATED_PROGRESS, type CouponLike } from "@/lib/pricing";
import { ORDER_STAGES, STATUS_LABELS } from "@/lib/constants";
import { money, orderNumber, toNumber, trackingCode } from "@/lib/utils";
import { notifyAdmins, notifyUser, recordAudit } from "@/lib/activity";

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

/** Ordered statuses the automation pipeline may move through. */
const PIPELINE: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "AWAITING_CONFIRMATION",
];

export function stageFor(status: OrderStatus) {
  return ORDER_STAGES.find((stage) => stage.status === status) ?? null;
}

export function nextPipelineStatus(status: OrderStatus): OrderStatus | null {
  const index = PIPELINE.indexOf(status);
  if (index === -1 || index >= PIPELINE.length - 1) return null;
  return PIPELINE[index + 1] ?? null;
}

/* ------------------------------------------------------------- creation */

export type CreateOrderInput = {
  userId: string | null;
  email: string;
  phone: string;
  shippingAddress: Record<string, string>;
  paymentMethod: "COD" | "CARD" | "WALLET" | "BANK_TRANSFER";
  shippingPlanId?: string | null;
  couponCode?: string | null;
  notes?: string | null;
  cartId: string;
};

/**
 * Creates an order inside a single transaction:
 *  - re-prices every line from the database (never trusts the client)
 *  - validates and decrements stock atomically
 *  - records the order timeline, coupon usage and notifications
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({
        itemId: cartItems.id,
        quantity: cartItems.quantity,
        productId: products.id,
        variantId: cartItems.variantId,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        images: products.images,
        price: products.price,
        stock: products.stock,
        status: products.status,
        variantName: productVariants.name,
        variantSku: productVariants.sku,
        variantDelta: productVariants.priceDelta,
        variantStock: productVariants.stock,
        variantActive: productVariants.isActive,
        variantImage: productVariants.imageUrl,
      })
      .from(cartItems)
      .innerJoin(products, eq(products.id, cartItems.productId))
      .leftJoin(productVariants, eq(productVariants.id, cartItems.variantId))
      .where(eq(cartItems.cartId, input.cartId));

    if (rows.length === 0) throw new OrderError("Your cart is empty", 400);

    for (const row of rows) {
      if (row.status !== "ACTIVE") {
        throw new OrderError(`${row.name} is no longer available`, 409);
      }
      const available = row.variantId ? (row.variantStock ?? 0) : row.stock;
      if (available < row.quantity) {
        throw new OrderError(
          `Only ${available} left of ${row.name}. Please update your cart.`,
          409,
        );
      }
      if (row.variantId && !row.variantActive) {
        throw new OrderError(`The selected option for ${row.name} is unavailable`, 409);
      }
    }

    // --- coupon (re-validated server side)
    let couponRow = null;
    if (input.couponCode) {
      const found = await tx
        .select()
        .from(coupons)
        .where(eq(coupons.code, input.couponCode.trim().toUpperCase()))
        .limit(1);
      const candidate = found[0];
      if (candidate && candidate.isActive) {
        const now = new Date();
        const notStarted = candidate.startsAt && candidate.startsAt > now;
        const expired = candidate.expiresAt && candidate.expiresAt < now;
        const exhausted =
          candidate.maxUses !== null && candidate.usedCount >= candidate.maxUses;
        if (!notStarted && !expired && !exhausted) couponRow = candidate;
      }
    }

    if (couponRow && couponRow.perUserLimit > 0 && input.userId) {
      const usedByUser = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.userId, input.userId),
            eq(orders.couponCode, couponRow.code),
            sql`${orders.status} <> 'CANCELLED'`,
          ),
        );
      if ((usedByUser[0]?.count ?? 0) >= couponRow.perUserLimit) {
        throw new OrderError("You have already used this coupon", 409);
      }
    }

    const couponLike: CouponLike | null = couponRow
      ? {
          code: couponRow.code,
          type: couponRow.type,
          value: couponRow.value,
          minSubtotal: couponRow.minSubtotal,
          maxDiscount: couponRow.maxDiscount,
        }
      : null;

    // --- shipping plan
    let plan: ShippingPlan | null = null;
    if (input.shippingPlanId) {
      const planRows = await tx
        .select()
        .from(shippingPlans)
        .where(
          and(
            eq(shippingPlans.id, input.shippingPlanId),
            eq(shippingPlans.isActive, true),
          ),
        )
        .limit(1);
      plan = planRows[0] ?? null;
    }
    if (!plan) {
      const fallback = await tx
        .select()
        .from(shippingPlans)
        .where(eq(shippingPlans.isActive, true))
        .orderBy(sql`${shippingPlans.isDefault} desc`)
        .limit(1);
      plan = fallback[0] ?? null;
    }

    const lines = rows.map((row) => ({
      unitPrice: toNumber(row.price) + toNumber(row.variantDelta),
      quantity: row.quantity,
    }));

    const totals = computeTotals({ lines, coupon: couponLike, plan });

    const placedAt = new Date();
    const days = plan?.maxDays ?? 7;
    const expectedDeliveryAt = new Date(placedAt.getTime() + days * 86_400_000);

    const insertedOrders = await tx
      .insert(orders)
      .values({
        orderNumber: orderNumber(),
        userId: input.userId,
        email: input.email,
        phone: input.phone,
        status: "PENDING",
        paymentStatus: input.paymentMethod === "COD" ? "COD_DUE" : "UNPAID",
        paymentMethod: input.paymentMethod,
        progress: MAX_AUTOMATED_PROGRESS > 0 ? 5 : 0,
        subtotal: money(totals.subtotal),
        discount: money(totals.discount),
        shippingCost: money(totals.shipping),
        tax: money(totals.tax),
        total: money(totals.total),
        couponCode: couponRow?.code ?? null,
        shippingPlanId: plan?.id ?? null,
        shippingAddress: input.shippingAddress,
        notes: input.notes ?? null,
        trackingCode: trackingCode(),
        placedAt,
        expectedDeliveryAt,
        lastAutomationAt: placedAt,
      })
      .returning();

    const order = insertedOrders[0];
    if (!order) throw new OrderError("Could not create the order", 500);

    await tx.insert(orderItems).values(
      rows.map((row) => ({
        orderId: order.id,
        productId: row.productId,
        variantId: row.variantId,
        productName: row.variantName ? `${row.name} — ${row.variantName}` : row.name,
        productSlug: row.slug,
        sku: row.variantSku ?? row.sku,
        imageUrl: row.variantImage ?? row.images[0] ?? null,
        unitPrice: money(toNumber(row.price) + toNumber(row.variantDelta)),
        quantity: row.quantity,
        lineTotal: money(
          (toNumber(row.price) + toNumber(row.variantDelta)) * row.quantity,
        ),
        options: row.variantName ? { variant: row.variantName } : null,
      })),
    );

    // Atomically decrement stock and increment sold counters.
    for (const row of rows) {
      if (row.variantId) {
        await tx
          .update(productVariants)
          .set({ stock: sql`greatest(${productVariants.stock} - ${row.quantity}, 0)` })
          .where(
            and(
              eq(productVariants.id, row.variantId),
              sql`${productVariants.stock} >= ${row.quantity}`,
            ),
          );
      }
      const updated = await tx
        .update(products)
        .set({
          stock: sql`greatest(${products.stock} - ${row.quantity}, 0)`,
          soldCount: sql`${products.soldCount} + ${row.quantity}`,
        })
        .where(and(eq(products.id, row.productId), sql`${products.stock} >= ${row.quantity}`))
        .returning({ id: products.id });

      if (updated.length === 0) {
        // Someone else bought the last unit between validation and update.
        throw new OrderError(
          `Stock for ${row.name} changed while you were checking out. Please retry.`,
          409,
        );
      }
    }

    if (couponRow) {
      await tx
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.id, couponRow.id));
    }

    await tx.insert(orderEvents).values({
      orderId: order.id,
      type: "ORDER_PLACED",
      message: `Order ${order.orderNumber} placed with ${input.paymentMethod} payment.`,
      progress: 5,
      actorType: input.userId ? "CUSTOMER" : "SYSTEM",
      actorId: input.userId,
    });

    if (input.paymentMethod !== "COD") {
      await tx.insert(payments).values({
        orderId: order.id,
        provider: "manual",
        amount: money(totals.total),
        status: "PENDING",
      });
    }

    await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId));
    await tx
      .update(carts)
      .set({ couponCode: null, updatedAt: new Date() })
      .where(eq(carts.id, input.cartId));

    await notifyUser({
      userId: input.userId,
      type: "ORDER",
      title: `Order ${order.orderNumber} received`,
      body: `We have your order for ${money(totals.total)} ${order.currency}. Track progress from your dashboard.`,
      link: `/track?order=${order.orderNumber}`,
    });

    return order;
  });
}

/* -------------------------------------------------------- transitions */

const EVENT_LABELS: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Order confirmed",
  PROCESSING: "Preparing your items",
  PACKED: "Order packed",
  SHIPPED: "Order shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  AWAITING_CONFIRMATION: "Delivered — awaiting your confirmation",
  DELIVERED: "Delivery confirmed",
  DISPUTED: "Delivery disputed",
  CANCELLED: "Order cancelled",
  RETURNED: "Order returned",
};

export async function transitionOrder(input: {
  orderId: string;
  status: OrderStatus;
  actorType: "SYSTEM" | "CUSTOMER" | "ADMIN" | "WORKER";
  actorId?: string | null;
  message?: string;
  allowDelivered?: boolean;
}): Promise<Order | null> {
  const stage = stageFor(input.status);
  const progress = input.status === "DELIVERED" ? 100 : (stage?.progress ?? 0);

  if (input.status === "DELIVERED" && !input.allowDelivered) {
    // Safety net: automation must never mark an order delivered.
    throw new OrderError("Delivery requires explicit confirmation", 403);
  }

  const updated = await db
    .update(orders)
    .set({
      status: input.status,
      progress: Math.min(progress, input.status === "DELIVERED" ? 100 : 99),
      updatedAt: new Date(),
      deliveredAt: input.status === "DELIVERED" ? new Date() : undefined,
      cancelledAt: input.status === "CANCELLED" ? new Date() : undefined,
      confirmationPromptedAt:
        input.status === "AWAITING_CONFIRMATION" ? new Date() : undefined,
    })
    .where(eq(orders.id, input.orderId))
    .returning();

  const order = updated[0];
  if (!order) return null;

  await db.insert(orderEvents).values({
    orderId: order.id,
    type: input.status,
    message:
      input.message ??
      EVENT_LABELS[input.status] ??
      `Status changed to ${STATUS_LABELS[input.status]}`,
    progress,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
  });

  await notifyUser({
    userId: order.userId,
    type: "ORDER",
    title: `Order ${order.orderNumber}: ${STATUS_LABELS[input.status]}`,
    body: stage?.customerMessage ?? input.message,
    link: `/account/orders/${order.id}`,
  });

  return order;
}

/* ------------------------------------------------------------- delivery */

export async function confirmDelivery(input: {
  orderId: string;
  userId: string;
}): Promise<void> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, input.orderId), eq(orders.userId, input.userId)))
    .limit(1);
  const order = rows[0];
  if (!order) throw new OrderError("Order not found", 404);

  if (order.status === "DELIVERED") return;
  if (
    !["AWAITING_CONFIRMATION", "OUT_FOR_DELIVERY", "SHIPPED"].includes(order.status)
  ) {
    throw new OrderError("This order is not awaiting a delivery confirmation", 409);
  }

  await db
    .update(orders)
    .set({
      status: "DELIVERED",
      progress: 100,
      customerConfirmedAt: new Date(),
      deliveredAt: new Date(),
      paymentStatus:
        order.paymentMethod === "COD" ? "PAID" : order.paymentStatus,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  await db.insert(orderEvents).values({
    orderId: order.id,
    type: "DELIVERED",
    message: "Customer confirmed receipt of the order.",
    progress: 100,
    actorType: "CUSTOMER",
    actorId: input.userId,
  });

  await recordAudit({
    actorId: input.userId,
    action: "order.delivery_confirmed",
    entity: "order",
    entityId: order.id,
    meta: { orderNumber: order.orderNumber },
  });

  await notifyUser({
    userId: order.userId,
    type: "ORDER",
    title: `Order ${order.orderNumber} delivered`,
    body: "Thanks for confirming! We would love your review on the products you received.",
    link: `/account/orders/${order.id}`,
  });
}

export async function disputeDelivery(input: {
  orderId: string;
  userId: string;
  reason: string;
}): Promise<void> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, input.orderId), eq(orders.userId, input.userId)))
    .limit(1);
  const order = rows[0];
  if (!order) throw new OrderError("Order not found", 404);
  if (order.status === "DELIVERED") {
    throw new OrderError("This order is already marked delivered", 409);
  }

  await db
    .update(orders)
    .set({ status: "DISPUTED", updatedAt: new Date() })
    .where(eq(orders.id, order.id));

  await db.insert(orderEvents).values({
    orderId: order.id,
    type: "DISPUTED",
    message: `Customer reported the parcel has not arrived: ${input.reason.slice(0, 300)}`,
    progress: order.progress,
    actorType: "CUSTOMER",
    actorId: input.userId,
  });

  await notifyAdmins({
    type: "DISPUTE",
    title: `Delivery dispute — ${order.orderNumber}`,
    body: input.reason.slice(0, 400),
    link: `/admin/orders/${order.id}`,
  });

  await recordAudit({
    actorId: input.userId,
    action: "order.delivery_disputed",
    entity: "order",
    entityId: order.id,
    meta: { orderNumber: order.orderNumber, reason: input.reason.slice(0, 300) },
  });
}

/* ------------------------------------------------------------ automation */

export type AutomationSummary = {
  scanned: number;
  advanced: number;
  escalated: number;
  skipped: number;
  details: { orderNumber: string; from: OrderStatus; to: OrderStatus }[];
};

/**
 * Background pipeline: advances every in-flight order one stage at a time
 * based on its shipping plan's cadence. It can never reach 100% — the final
 * step always waits for the customer (or an admin override).
 */
export async function runOrderAutomation(now = new Date()): Promise<AutomationSummary> {
  const active = await db
    .select({
      order: orders,
      plan: shippingPlans,
    })
    .from(orders)
    .leftJoin(shippingPlans, eq(shippingPlans.id, orders.shippingPlanId))
    .where(
      inArray(orders.status, [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "AWAITING_CONFIRMATION",
      ]),
    )
    .orderBy(orders.placedAt)
    .limit(500);

  const summary: AutomationSummary = {
    scanned: active.length,
    advanced: 0,
    escalated: 0,
    skipped: 0,
    details: [],
  };

  for (const row of active) {
    const order = row.order;
    const intervalHours = row.plan?.stageIntervalHours ?? 12;
    const last = order.lastAutomationAt ?? order.placedAt;
    const elapsedHours = (now.getTime() - last.getTime()) / 3_600_000;

    if (order.status === "AWAITING_CONFIRMATION") {
      // 99% state: never auto-deliver. Escalate to admins after 3 days.
      const prompted = order.confirmationPromptedAt ?? last;
      const daysSince = (now.getTime() - prompted.getTime()) / 86_400_000;
      if (daysSince > 3 && elapsedHours > 24) {
        await notifyAdmins({
          type: "DISPUTE",
          title: `Awaiting customer confirmation — ${order.orderNumber}`,
          body: "The parcel was marked as delivered 3+ days ago and the customer has not confirmed. Please verify.",
          link: `/admin/orders/${order.id}`,
        });
        await db
          .update(orders)
          .set({ lastAutomationAt: now })
          .where(eq(orders.id, order.id));
        summary.escalated += 1;
      } else {
        summary.skipped += 1;
      }
      continue;
    }

    if (elapsedHours < intervalHours) {
      summary.skipped += 1;
      continue;
    }

    // OUT_FOR_DELIVERY waits for the expected delivery date before the
    // "awaiting confirmation" prompt, so customers are not asked too early.
    if (order.status === "OUT_FOR_DELIVERY" && order.expectedDeliveryAt) {
      if (now < order.expectedDeliveryAt) {
        summary.skipped += 1;
        continue;
      }
    }

    const next = nextPipelineStatus(order.status);
    if (!next) {
      summary.skipped += 1;
      continue;
    }

    await db
      .update(orders)
      .set({ lastAutomationAt: now })
      .where(eq(orders.id, order.id));

    await transitionOrder({
      orderId: order.id,
      status: next,
      actorType: "WORKER",
      message: `Automated update: ${STATUS_LABELS[order.status]} → ${STATUS_LABELS[next]}`,
    });

    summary.advanced += 1;
    summary.details.push({ orderNumber: order.orderNumber, from: order.status, to: next });
  }

  return summary;
}

/* --------------------------------------------------------------- lookups */

export async function getOrderById(id: string) {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const order = rows[0];
  if (!order) return null;
  const [items, events, plan] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id))
      .orderBy(orderEvents.createdAt),
    order.shippingPlanId
      ? db.select().from(shippingPlans).where(eq(shippingPlans.id, order.shippingPlanId)).limit(1)
      : Promise.resolve([]),
  ]);
  return { order, items, events, plan: plan[0] ?? null };
}

export async function getOrderByNumberForTracking(orderNumberOrTracking: string) {
  const term = orderNumberOrTracking.trim().toUpperCase();
  const rows = await db
    .select()
    .from(orders)
    .where(
      sql`upper(${orders.orderNumber}) = ${term} or upper(${orders.trackingCode}) = ${term}`,
    )
    .limit(1);
  const order = rows[0];
  if (!order) return null;

  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, order.id))
      .orderBy(orderEvents.createdAt),
  ]);
  return { order, items, events };
}

export async function getOrdersForUser(userId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(sql`${orders.placedAt} desc`)
    .limit(50);
}

export async function getCustomerStats(userId: string) {
  const rows = await db
    .select({
      orders: sql<number>`count(*)::int`,
      spent: sql<string>`coalesce(sum(case when ${orders.status} = 'DELIVERED' then ${orders.total} else 0 end), 0)`,
      open: sql<number>`count(*) filter (where ${orders.status} not in ('DELIVERED','CANCELLED','RETURNED'))::int`,
    })
    .from(orders)
    .where(eq(orders.userId, userId));
  return {
    orders: rows[0]?.orders ?? 0,
    spent: Number(rows[0]?.spent ?? 0),
    open: rows[0]?.open ?? 0,
  };
}

export async function getUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.emailNormalized, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}
