import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { adminSetupSchema, validAdminSetupToken } from "@/lib/admin-setup";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;
    const limited = await enforceRateLimit("admin-setup", 5, 15 * 60_000);
    if (limited) return limited;
    const payload = adminSetupSchema.parse(await readJson(request));
    if (!validAdminSetupToken(payload.token)) {
      return jsonError("Setup is disabled, expired, or the owner token is invalid.", 403);
    }

    const passwordHash = await hashPassword(payload.password);
    const result = await db.transaction(async (tx) => {
      // All concurrent bootstrap attempts serialize before checking first admin.
      await tx.execute(sql`select pg_advisory_xact_lock(734218, 2)`);
      const existing = await tx.select({ id: users.id }).from(users)
        .where(eq(users.role, "SUPER_ADMIN")).limit(1);
      if (existing.length) return { conflict: "Setup is already complete. Use the normal login or password recovery." };
      const occupied = await tx.select({ id: users.id }).from(users)
        .where(eq(users.emailNormalized, "admin@nexvoro.com")).limit(1);
      // Never silently promote or replace an existing account or its password.
      if (occupied.length) return { conflict: "The admin email already exists. An authorized database owner must review that account; setup will not overwrite it." };
      const [user] = await tx.insert(users).values({
        email: "admin@nexvoro.com", emailNormalized: "admin@nexvoro.com",
        passwordHash, firstName: "Store", lastName: "Owner", role: "SUPER_ADMIN",
        isActive: true,
      }).returning({ id: users.id, email: users.email, role: users.role });
      if (!user) throw new Error("Super Admin creation did not return a user");
      await tx.insert(auditLogs).values({ actorId: user.id, actorEmail: user.email,
        action: "auth.super_admin_bootstrapped", entity: "user", entityId: user.id });
      return { user };
    });
    if (result.conflict) return jsonError(result.conflict, 409);
    // Login is deliberately separate, exercising the existing authentication.
    return jsonOk({ user: result.user, loginUrl: "/login?next=/admin" }, 201);
  } catch (error) {
    return handleError(error);
  }
}
