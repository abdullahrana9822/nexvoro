import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { sessions, users, type User, type UserRole } from "@/db/schema";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "nexvoro_session";
const SESSION_TTL_DAYS = 30;
const BCRYPT_ROUNDS = 12;

/* --------------------------------------------------------------- passwords */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export { passwordStrength } from "@/lib/password-strength";

/* ----------------------------------------------------------------- sessions */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "role" | "phone"
>;

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  const headerList = await headers();

  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    ipAddress: headerList.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 60) ?? null,
    userAgent: headerList.get("user-agent")?.slice(0, 400) ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/** Returns the signed-in user, or null. Never trusts the cookie contents. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return (await getSession()).user;
}

export async function getSession(): Promise<{
  user: SessionUser | null;
  sessionId: string | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return { user: null, sessionId: null };

  const rows = await db
    .select({
      sessionId: sessions.id,
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      phone: users.phone,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row || !row.isActive) return { user: null, sessionId: null };

  return {
    user: {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      phone: row.phone,
    },
    sessionId: row.sessionId,
  };
}

/* ------------------------------------------------------------------- roles */

const ROLE_RANK: Record<UserRole, number> = {
  CUSTOMER: 1,
  STAFF: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasRole(userRole: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minimum];
}

export function isStaffRole(role: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.STAFF;
}

export class AuthorizationError extends Error {
  status: number;
  constructor(message = "Not authorised", status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

/** Server-side guard for any privileged operation. Throws on failure. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Authentication required", 401);
  return user;
}

export async function requireRole(minimum: UserRole): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasRole(user.role, minimum)) {
    throw new AuthorizationError("You do not have access to this resource");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("ADMIN");
}

/** Constant-time string comparison used for secrets (cron, webhooks). */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
