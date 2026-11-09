import "./load-env";
import { Client } from "pg";

/**
 * Supabase connectivity + schema verifier.
 *
 *   npm run db:verify                 # uses DATABASE_URL (+ DIRECT_URL)
 *   SUPABASE_DB_PASSWORD="…" npm run db:verify
 *
 * Prints a pass/fail table for: TCP reachability, TLS, database identity,
 * applied migrations, required tables, row counts, and the Storage
 * configuration. Never prints the password or the full connection string.
 */
const REQUIRED_TABLES = [
  "users",
  "sessions",
  "password_reset_tokens",
  "addresses",
  "brands",
  "categories",
  "products",
  "product_variants",
  "reviews",
  "carts",
  "cart_items",
  "wishlist_items",
  "coupons",
  "shipping_plans",
  "orders",
  "order_items",
  "order_events",
  "payments",
  "notifications",
  "settings",
  "audit_logs",
  "newsletter_subscribers",
  "contact_messages",
] as const;

function redact(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.username}:***@${parsed.hostname}:${parsed.port || "(default)"}${parsed.pathname}`;
  } catch {
    return "(unparseable connection string)";
  }
}

function needsSsl(url: string): boolean {
  return !/localhost|127\.0\.0\.1|::1/.test(url);
}

async function check(label: string, url: string, passwordOverride?: string) {
  let connectionString = url;
  if (passwordOverride) {
    const parsed = new URL(url);
    parsed.password = encodeURIComponent(passwordOverride);
    connectionString = parsed.toString();
  }

  const client = new Client({
    connectionString,
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 15_000,
    statement_timeout: 20_000,
  });

  const rows: [string, string][] = [];
  const started = Date.now();

  try {
    await client.connect();
    rows.push(["connection", `OK (${Date.now() - started} ms)`]);

    const info = await client.query<{
      version: string;
      db: string;
      user: string;
      ssl: boolean;
    }>(
      `select current_database() as db,
              current_user as user,
              (select ssl from pg_stat_ssl where pid = pg_backend_pid()) as ssl,
              version() as version`,
    );
    const row = info.rows[0];
    rows.push(["database", row ? `${row.db} as ${row.user}` : "unknown"]);
    rows.push(["tls", row?.ssl ? "encrypted" : "not encrypted"]);
    rows.push(["server", (row?.version ?? "").split(" on ")[0] ?? "unknown"]);

    const applied = await client
      .query<{ name: string }>(`select name from drizzle."__migrations" order by name`)
      .catch(() => ({ rows: [] as { name: string }[] }));
    rows.push([
      "migrations",
      applied.rows.length ? applied.rows.map((r) => r.name).join(", ") : "none recorded",
    ]);

    const present = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const names = new Set(present.rows.map((r) => r.table_name));
    const missing = REQUIRED_TABLES.filter((t) => !names.has(t));
    rows.push([
      "tables",
      missing.length === 0
        ? `all ${REQUIRED_TABLES.length} present`
        : `MISSING: ${missing.join(", ")}`,
    ]);

    if (missing.length === 0) {
      const counts = await client.query<{ products: number; orders: number; users: number }>(
        `select (select count(*) from products)::int as products,
                (select count(*) from orders)::int as orders,
                (select count(*) from users)::int as users`,
      );
      const c = counts.rows[0];
      rows.push([
        "data",
        c ? `${c.products} products · ${c.orders} orders · ${c.users} users` : "empty",
      ]);
    }

    const pooler = /pooler\.supabase\.com/.test(url);
    rows.push(["pooler", pooler ? "transaction pooler (port 6543)" : "direct connection"]);

    console.log(`\n${label}  ${redact(url)}`);
    for (const [k, v] of rows) console.log(`  ${k.padEnd(12)} ${v}`);

    return missing.length === 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`\n${label}  ${redact(url)}`);
    console.log(`  connection   FAILED`);
    console.log(`  reason       ${message.slice(0, 300)}`);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;

  if (!databaseUrl) {
    console.error(
      "DATABASE_URL is not set.\n" +
        "Add it to .env.local (or export it) — see .env.example for the Supabase format.",
    );
    process.exit(1);
  }

  let ok = await check("DATABASE_URL (runtime)", databaseUrl, password);
  if (directUrl && directUrl !== databaseUrl) {
    const directOk = await check("DIRECT_URL (migrations)", directUrl, password);
    ok = ok && directOk;
  }

  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`\nStorage`);
  console.log(`  project      ${storageUrl ? new URL(storageUrl).host : "not configured"}`);
  console.log(`  service key  ${serviceKey ? "present (server-only)" : "missing — uploads disabled"}`);

  console.log(`\n${ok ? "RESULT: schema verified" : "RESULT: not verified — see failures above"}\n`);
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error("[verify] error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
