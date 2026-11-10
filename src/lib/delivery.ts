import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

/**
 * Returns the most recent order that is waiting for a customer delivery
 * confirmation, but only once its expected delivery date has been reached and
 * the customer has not been prompted in the last 12 hours.
 */
export async function getPendingConfirmationOrder(userId: string) {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      expectedDeliveryAt: orders.expectedDeliveryAt,
      confirmationPromptedAt: orders.confirmationPromptedAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        inArray(orders.status, ["AWAITING_CONFIRMATION", "OUT_FOR_DELIVERY", "SHIPPED"]),
      ),
    )
    .orderBy(desc(orders.placedAt))
    .limit(1);

  const order = rows[0];
  if (!order) return null;

  const now = new Date();
  if (order.expectedDeliveryAt && order.expectedDeliveryAt > now) return null;

  if (order.confirmationPromptedAt) {
    const hours = (now.getTime() - order.confirmationPromptedAt.getTime()) / 3_600_000;
    if (hours < 12) return null;
  }

  return order;
}

export async function markConfirmationPrompted(orderId: string) {
  await db
    .update(orders)
    .set({ confirmationPromptedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function countPendingConfirmations(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        inArray(orders.status, ["AWAITING_CONFIRMATION"]),
      ),
    );
  return rows[0]?.count ?? 0;
}
