import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation";
import { consumeResetToken } from "@/lib/password-reset";
import { hashPassword, revokeAllSessions } from "@/lib/auth";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Completes a password reset: new hash, token burned, all sessions revoked. */
export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("reset-password", 10, 15 * 60_000);
    if (limited) return limited;

    const { token, password } = resetPasswordSchema.parse(await readJson(request));

    const userId = await consumeResetToken(token);
    if (!userId) {
      return jsonError("This reset link is invalid or has expired. Request a new one.", 400);
    }

    const passwordHash = await hashPassword(password);
    await db
      .update(users)
      .set({
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // A password reset must invalidate every existing session.
    await revokeAllSessions(userId);

    await recordAudit({
      actorId: userId,
      action: "auth.password_reset_completed",
      entity: "user",
      entityId: userId,
    });

    return jsonOk({ message: "Password updated. Sign in with your new password." });
  } catch (error) {
    return handleError(error);
  }
}
