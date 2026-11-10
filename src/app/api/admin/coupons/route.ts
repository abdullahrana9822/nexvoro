import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { assertSameOrigin, handleError, readJson, withRole } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i, "Use letters, numbers, dash or underscore"),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive().max(1_000_000),
  minSubtotal: z.coerce.number().nonnegative().max(10_000_000).optional(),
  maxDiscount: z.coerce.number().nonnegative().max(10_000_000).optional(),
  maxUses: z.coerce.number().int().positive().max(1_000_000).optional(),
  perUserLimit: z.coerce.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = schema.parse(await readJson(request));
      const code = payload.code.toUpperCase();

      const existing = await db
        .select({ id: coupons.id })
        .from(coupons)
        .where(eq(coupons.code, code))
        .limit(1);
      if (existing[0]) return jsonError("That coupon code already exists", 409);

      if (payload.type === "PERCENTAGE" && payload.value > 100) {
        return jsonError("A percentage discount cannot exceed 100", 422);
      }

      const inserted = await db
        .insert(coupons)
        .values({
          code,
          description: payload.description || null,
          type: payload.type,
          value: payload.value.toFixed(2),
          minSubtotal: (payload.minSubtotal ?? 0).toFixed(2),
          maxDiscount:
            payload.maxDiscount !== undefined ? payload.maxDiscount.toFixed(2) : null,
          maxUses: payload.maxUses ?? null,
          perUserLimit: payload.perUserLimit ?? 1,
          isActive: payload.isActive ?? true,
        })
        .returning();

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "coupon.created",
        entity: "coupon",
        entityId: inserted[0]?.id,
        meta: { code },
      });

      return jsonOk({ coupon: inserted[0] }, 201);
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = schema
        .partial()
        .extend({ id: z.string().uuid(), isActive: z.boolean().optional() })
        .parse(await readJson(request));

      const updated = await db
        .update(coupons)
        .set({
          description:
            payload.description === undefined ? undefined : payload.description || null,
          isActive: payload.isActive,
          maxUses: payload.maxUses,
        })
        .where(eq(coupons.id, payload.id))
        .returning();

      if (!updated[0]) return jsonError("Coupon not found", 404);

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "coupon.updated",
        entity: "coupon",
        entityId: payload.id,
      });

      return jsonOk({ coupon: updated[0] });
    });
  } catch (error) {
    return handleError(error);
  }
}
