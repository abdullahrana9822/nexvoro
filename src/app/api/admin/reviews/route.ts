import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { assertSameOrigin, handleError, readJson, withRole } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});

export async function PATCH(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = schema.parse(await readJson(request));

      const updated = await db
        .update(reviews)
        .set({ status: payload.status })
        .where(eq(reviews.id, payload.id))
        .returning();

      const review = updated[0];
      if (!review) return jsonError("Review not found", 404);

      // Recalculate the product's aggregate rating after moderation.
      const agg = await db
        .select({
          avg: sql<string>`coalesce(avg(${reviews.rating}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(reviews)
        .where(
          sql`${reviews.productId} = ${review.productId} and ${reviews.status} = 'APPROVED'`,
        );

      await db
        .update(products)
        .set({
          ratingAvg: Number(agg[0]?.avg ?? 0).toFixed(2),
          ratingCount: agg[0]?.count ?? 0,
        })
        .where(eq(products.id, review.productId));

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: `review.${payload.status.toLowerCase()}`,
        entity: "review",
        entityId: payload.id,
      });

      return jsonOk({ review });
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const id = new URL(request.url).searchParams.get("id");
      if (!id) return jsonError("Review id is required", 422);

      const deleted = await db
        .delete(reviews)
        .where(eq(reviews.id, id))
        .returning({ productId: reviews.productId });

      if (!deleted[0]) return jsonError("Review not found", 404);

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "review.deleted",
        entity: "review",
        entityId: id,
      });

      return jsonOk({ deleted: true });
    });
  } catch (error) {
    return handleError(error);
  }
}
