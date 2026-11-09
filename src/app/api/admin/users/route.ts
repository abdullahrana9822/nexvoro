import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, userRoleEnum } from "@/db/schema";
import { assertSameOrigin, handleError, readJson, withRole } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string().uuid(),
  role: z.enum(userRoleEnum.enumValues).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    // Role changes require the highest privilege level.
    return await withRole("SUPER_ADMIN", async (user) => {
      const payload = schema.parse(await readJson(request));

      if (payload.userId === user.id && payload.role && payload.role !== user.role) {
        return jsonError("You cannot change your own role", 422);
      }

      if (payload.role && payload.role !== "CUSTOMER" && payload.userId === user.id) {
        return jsonError("You cannot change your own role", 422);
      }

      const updated = await db
        .update(users)
        .set({
          role: payload.role,
          isActive: payload.isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, payload.userId))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
        });

      if (!updated[0]) return jsonError("User not found", 404);

      if (payload.isActive === false) {
        await db.execute(
          sql`update sessions set revoked_at = now() where user_id = ${payload.userId} and revoked_at is null`,
        );
      }

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "user.role_updated",
        entity: "user",
        entityId: payload.userId,
        meta: { role: payload.role, isActive: payload.isActive },
      });

      return jsonOk({ user: updated[0] });
    });
  } catch (error) {
    return handleError(error);
  }
}
