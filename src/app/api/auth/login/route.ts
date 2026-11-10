import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";
import {
  assertSameOrigin,
  enforceRateLimit,
  handleError,
  readJson,
} from "@/lib/api";
import { createSession, verifyPassword } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { jsonError, jsonOk } from "@/lib/utils";
import { recordAudit } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAILED = 6;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("login", 10, 5 * 60_000);
    if (limited) return limited;

    const payload = loginSchema.parse(await readJson(request));

    const rows = await db
      .select()
      .from(users)
      .where(
        payload.email.includes("@")
          ? eq(users.emailNormalized, payload.email)
          : sql`lower(${users.username}) = ${payload.email}`,
      )
      .limit(1);
    const user = rows[0];

    // Always run a hash comparison so response timing does not reveal whether
    // the account exists.
    const dummyHash =
      "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZQ4e8C0j9Q1Q0Xg8bJ0cQ1oR0mZ2Hu";
    const hash = user?.passwordHash ?? dummyHash;
    const valid = await verifyPassword(payload.password, hash);

    if (!user || !valid || !user.isActive) {
      if (user) {
        const failed = user.failedLoginCount + 1;
        await db
          .update(users)
          .set({
            failedLoginCount: failed,
            lockedUntil:
              failed >= MAX_FAILED
                ? new Date(Date.now() + LOCK_MINUTES * 60_000)
                : user.lockedUntil,
          })
          .where(eq(users.id, user.id));
      }
      return jsonError("Incorrect email or password", 401);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return jsonError(
        "This account is temporarily locked after repeated failed attempts. Try again later.",
        423,
      );
    }

    await db
      .update(users)
      .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    await createSession(user.id);
    await mergeGuestCart(user.id);
    await recordAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "auth.login",
      entity: "user",
      entityId: user.id,
    });

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role,
      },
      redirectTo: user.mustChangePassword
        ? "/change-password"
        : payload.redirectTo &&
            payload.redirectTo.startsWith("/") &&
            !payload.redirectTo.startsWith("//") &&
            !payload.redirectTo.includes("\\")
          ? payload.redirectTo
          : user.role === "CUSTOMER"
            ? "/account"
            : "/admin",
    });
  } catch (error) {
    return handleError(error);
  }
}
