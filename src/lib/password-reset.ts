import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { env } from "@/lib/env";

/** Reset links are valid for one hour. */
export const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a single-use reset token for an email address.
 *
 * Returns the raw token only when the account exists, is active, and the
 * calling code may deliver it. Callers must always respond with the same
 * generic message so this endpoint cannot be used to enumerate accounts.
 *
 * Email delivery is not configured in this deployment, so in non-production
 * the link is returned to the caller for display; in production it is only
 * written to the audit log for an administrator to hand over securely.
 */
export async function createPasswordReset(
  email: string,
  requestedIp?: string | null,
): Promise<{ token: string | null; resetUrl: string | null }> {
  const [user] = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(eq(users.emailNormalized, email))
    .limit(1);

  if (!user || !user.isActive) return { token: null, resetUrl: null };

  // Invalidate any outstanding tokens for this user.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));

  // Housekeeping: drop tokens that expired more than a day ago.
  await db
    .delete(passwordResetTokens)
    .where(lt(passwordResetTokens.expiresAt, new Date(Date.now() - 86_400_000)));

  const token = randomBytes(32).toString("hex");
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
    requestedIp: requestedIp?.slice(0, 60) ?? null,
  });

  const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  return { token, resetUrl };
}

/** Resolves a token to its owner id, or null when invalid/expired/used. */
export async function verifyResetToken(token: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return row?.userId ?? null;
}

/** Marks a token as consumed. Returns false if it was already used. */
export async function consumeResetToken(token: string): Promise<string | null> {
  const updated = await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: passwordResetTokens.userId });

  return updated[0]?.userId ?? null;
}
