import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, reviews } from "@/db/schema";

/**
 * A review is only allowed when the customer has an order for the product that
 * has actually shipped, and they have not reviewed it before.
 */
export async function canUserReview(
  userId: string,
  productId: string,
): Promise<boolean> {
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);
  if (existing.length > 0) return false;

  const purchased = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orderItems.productId, productId),
        sql`${orders.status} in ('SHIPPED','OUT_FOR_DELIVERY','AWAITING_CONFIRMATION','DELIVERED')`,
      ),
    )
    .limit(1);

  return purchased.length > 0;
}
