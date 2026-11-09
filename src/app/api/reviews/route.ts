import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, reviews } from "@/db/schema";
import { reviewSchema } from "@/lib/validation";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { notifyAdmins, recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("review", 6, 10 * 60_000);
    if (limited) return limited;

    const payload = reviewSchema.parse(await readJson(request));
    const user = await getCurrentUser();

    const authorName =
      payload.authorName?.trim() ||
      (user ? `${user.firstName} ${user.lastName}`.trim() : "");

    if (!authorName) {
      return jsonError("Please add your name", 422, {
        authorName: "Please add your name",
      });
    }

    // A customer may only review a product they actually received.
    let verifiedPurchase = false;
    if (user) {
      const purchased = await db
        .select({ id: orderItems.id })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(
          and(
            eq(orders.userId, user.id),
            eq(orderItems.productId, payload.productId),
            sql`${orders.status} in ('DELIVERED','AWAITING_CONFIRMATION','SHIPPED')`,
          ),
        )
        .limit(1);
      verifiedPurchase = purchased.length > 0;

      const existing = await db
        .select({ id: reviews.id })
        .from(reviews)
        .where(and(eq(reviews.productId, payload.productId), eq(reviews.userId, user.id)))
        .limit(1);
      if (existing.length > 0) {
        return jsonError("You have already reviewed this product", 409);
      }
    }

    await db.insert(reviews).values({
      productId: payload.productId,
      userId: user?.id ?? null,
      authorName: authorName.slice(0, 120),
      rating: payload.rating,
      title: payload.title || null,
      body: payload.body || null,
      status: "PENDING",
    });

    await notifyAdmins({
      type: "REVIEW",
      title: "New review awaiting moderation",
      body: `${authorName} left a ${payload.rating}-star review.`,
      link: "/admin/reviews",
    });

    await recordAudit({
      actorId: user?.id ?? null,
      actorEmail: user?.email ?? null,
      action: "review.submitted",
      entity: "product",
      entityId: payload.productId,
      meta: { rating: payload.rating, verifiedPurchase },
    });

    return jsonOk(
      {
        message: "Thanks! Your review will appear once approved by our team.",
        verifiedPurchase,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
