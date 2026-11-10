import "./load-env";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db, pool } from "../src/db";
import { importCatalogueCandidates } from "../src/lib/catalogue-import";
import { users } from "../src/db/schema";

/** Run privately with securely supplied environment. No embedded credentials. */
async function main() {
  const username = process.env.OWNER_USERNAME?.trim().toLowerCase();
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_TEMP_PASSWORD;
  if (!username || !email || !password)
    throw new Error(
      "Set OWNER_USERNAME, OWNER_EMAIL and OWNER_TEMP_PASSWORD privately in the execution environment",
    );
  if (
    !/^[a-z0-9_]{3,80}$/.test(username) ||
    !email.includes("@") ||
    password.length < 10 ||
    Buffer.byteLength(password) > 72
  )
    throw new Error("Invalid owner identity or temporary password length");
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url)
    throw new Error("A rotated database connection must be supplied securely");
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname) &&
    process.env.CONFIRM_PRODUCTION_OWNER !== "CREATE_ONCE"
  )
    throw new Error(
      "Production creation requires CONFIRM_PRODUCTION_OWNER=CREATE_ONCE",
    );
  const hash = await bcrypt.hash(password, 12);
  let created = false;
  const inventory = await db.execute(
    sql`select (select count(*)::int from users) as users, (select count(*)::int from products) as products, (select count(*)::int from orders) as orders`,
  );
  console.log(
    "[owner] preflight inspected existing row counts:",
    JSON.stringify(inventory.rows[0]),
  );
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(734218, 2)`);
    const existing = await tx.execute(
      sql`select id, username, email_normalized, role from users where role='SUPER_ADMIN' or lower(username)=${username} or email_normalized=${email}`,
    );
    if (
      existing.rows.length &&
      process.env.OWNER_IDEMPOTENT_DEPLOY === "1" &&
      existing.rows.length === 1 &&
      existing.rows[0]?.username === username &&
      existing.rows[0]?.email_normalized === email &&
      existing.rows[0]?.role === "SUPER_ADMIN"
    ) {
      console.log(
        "[owner] matching production owner already exists; no credentials or permissions changed",
      );
      return;
    }
    if (existing.rows.length)
      throw new Error(
        "Existing owner or conflicting identity found. Refusing to overwrite credentials or permissions.",
      );
    await tx.insert(users).values({
      username,
      email,
      emailNormalized: email,
      passwordHash: hash,
      firstName: "Store Owner",
      role: "SUPER_ADMIN",
      mustChangePassword: true,
    });
    created = true;
  });
  if (created)
    console.log(
      "[owner] CREATED: committed one SUPER_ADMIN; mandatory password replacement enabled; bcrypt hash stored",
    );
  if (process.env.OWNER_IDEMPOTENT_DEPLOY === "1") {
    const catalogue = await importCatalogueCandidates();
    console.log(
      "[catalogue] merchant-review drafts:",
      JSON.stringify(catalogue),
    );
  }
  if (created && process.env.OWNER_IDEMPOTENT_DEPLOY === "1") {
    const base = "https://nexvoro-neon.vercel.app";
    const headers = { "Content-Type": "application/json", origin: base };
    const response = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify({ email: username, password }),
      signal: AbortSignal.timeout(30000),
    });
    const result = (await response.json()) as {
      user?: { role?: string };
      redirectTo?: string;
    };
    if (
      !response.ok ||
      result.user?.role !== "SUPER_ADMIN" ||
      result.redirectTo !== "/change-password"
    )
      throw new Error("Production login verification failed");
    const cookie = response.headers
      .get("set-cookie")
      ?.match(/nexvoro_session=[^;]+/)?.[0];
    if (!cookie) throw new Error("Production session missing");
    const restricted = await fetch(base + "/api/admin/products", {
      method: "PATCH",
      headers: { ...headers, cookie },
      body: "{}",
      signal: AbortSignal.timeout(30000),
    });
    if (restricted.status !== 403)
      throw new Error("Mandatory password-change guard verification failed");
    const logout = await fetch(base + "/api/auth/logout", {
      method: "POST",
      headers: { ...headers, cookie },
      signal: AbortSignal.timeout(30000),
    });
    if (!logout.ok) throw new Error("Production logout verification failed");
    const revoked = await fetch(base + "/api/admin/products", {
      method: "PATCH",
      headers: { ...headers, cookie },
      body: "{}",
      signal: AbortSignal.timeout(30000),
    });
    if (revoked.status !== 401)
      throw new Error("Production session revocation verification failed");
    console.log(
      "[owner] VERIFIED production username login 200 / SUPER_ADMIN role / mandatory-change guard 403 / logout 200 / revoked session 401",
    );
  }
}
main()
  .catch(() => {
    console.error(
      "Owner creation failed. Check required private configuration, migration status or existing account conflict. No existing account was changed.",
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());
