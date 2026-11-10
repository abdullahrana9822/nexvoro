import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import {
  assertSameOrigin,
  enforceRateLimit,
  handleError,
  readJson,
} from "@/lib/api";
import {
  getCurrentUser,
  hashPassword,
  verifyPassword,
  createSession,
} from "@/lib/auth";
import { passwordSchema } from "@/lib/validation";
import { jsonError, jsonOk } from "@/lib/utils";
import { recordAudit } from "@/lib/activity";
const schema = z.object({
  currentPassword: z.string().min(1).max(128),
  password: passwordSchema.min(14),
});
export async function POST(request: Request) {
  try {
    const origin = await assertSameOrigin();
    if (origin) return origin;
    const limit = await enforceRateLimit("change-password", 5, 300000);
    if (limit) return limit;
    const user = await getCurrentUser();
    if (!user) return jsonError("Authentication required", 401);
    const payload = schema.parse(await readJson(request));
    if (payload.currentPassword === payload.password)
      return jsonError("Choose a different password", 422);
    const [row] = await db
      .select({ hash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id));
    if (!row || !(await verifyPassword(payload.currentPassword, row.hash)))
      return jsonError("Current password is incorrect", 401);
    const nextHash = await hashPassword(payload.password);
    await db.transaction(async (tx) => {
      const changed = await tx
        .update(users)
        .set({
          passwordHash: nextHash,
          mustChangePassword: false,
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, user.id), eq(users.passwordHash, row.hash)))
        .returning({ id: users.id });
      if (!changed.length)
        throw new Error("Password changed in another session. Sign in again.");
      await tx
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(eq(sessions.userId, user.id));
    });
    await createSession(user.id);
    await recordAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "auth.password_changed",
      entity: "user",
      entityId: user.id,
    });
    return jsonOk({
      redirectTo: user.role === "CUSTOMER" ? "/account" : "/admin/dashboard",
    });
  } catch (error) {
    return handleError(error);
  }
}
