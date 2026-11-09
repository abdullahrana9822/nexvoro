import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { assertSameOrigin, handleError, readJson, withUser } from "@/lib/api";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ productId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withUser(async (user) => {
      const payload = schema.parse(await readJson(request));

      const existing = await db
        .select()
        .from(wishlistItems)
        .where(
          and(
            eq(wishlistItems.userId, user.id),
            eq(wishlistItems.productId, payload.productId),
          ),
        )
        .limit(1);

      if (existing[0]) {
        await db
          .delete(wishlistItems)
          .where(
            and(
              eq(wishlistItems.userId, user.id),
              eq(wishlistItems.productId, payload.productId),
            ),
          );
        return jsonOk({ saved: false });
      }

      await db
        .insert(wishlistItems)
        .values({ userId: user.id, productId: payload.productId })
        .onConflictDoNothing();
      return jsonOk({ saved: true });
    });
  } catch (error) {
    return handleError(error);
  }
}
