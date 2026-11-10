import { config } from "dotenv";
import { resolveDirectUrl } from "../src/lib/db-url";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

/**
 * Minimal, dependency-free migration runner.
 *
 * - Applies every .sql file in ./drizzle in filename order inside a
 *   transaction, and records it in drizzle.__migrations so reruns are no-ops.
 * - Fails loudly on error and rolls the failing migration back.
 * - Safe to run against production (idempotent, transactional).
 */
/** Removes sslmode/ssl query params so the explicit `ssl` option wins. */
function stripSslParams(connectionString: string): string {
  try {
    const parsed = new URL(connectionString);
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("ssl");
    parsed.searchParams.delete("uselibpqcompat");
    return parsed.toString();
  } catch {
    return connectionString;
  }
}

async function main() {
  // `--if-configured` is used by the Vercel build: a preview deployment without
  // a database must still be able to build, but a configured one always
  // migrates. Failures are never swallowed when a URL is present.
  const ifConfigured = process.argv.includes("--if-configured");
  const url = resolveDirectUrl();
  if (!url) {
    if (ifConfigured) {
      console.log("[migrate] no database connection configured — skipping");
      return;
    }
    console.error(
      "No database connection string found (DIRECT_URL / POSTGRES_URL_NON_POOLING / DATABASE_URL). Aborting migration.",
    );
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "drizzle");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  // Managed Postgres (Supabase, Neon, RDS) sits behind a CA that is not in the
  // container trust store, so Node rejects the chain with "self-signed
  // certificate in certificate chain". The connection is still TLS-encrypted;
  // the certificate is simply not verified. `sslmode` is deliberately stripped
  // from the URL first, because pg-connection-string derives its own ssl config
  // from the query string and `require` forces strict verification.
  const isLocal = /localhost|127\.0\.0\.1|::1/.test(url);
  const client = isLocal
    ? new Client({ connectionString: url })
    : new Client({ connectionString: stripSslParams(url), ssl: { rejectUnauthorized: false } });

  await client.connect();
  try {
    // Serialize concurrent production/preview builds against the same database.
    // Session lock is released automatically when this dedicated client closes.
    await client.query("select pg_advisory_lock(734218, 1)");
    await client.query("create schema if not exists drizzle");
    await client.query(`
      create table if not exists drizzle."__migrations" (
        id serial primary key,
        hash varchar(64) not null,
        name varchar(255) not null unique,
        applied_at timestamptz not null default now()
      )
    `);

    const applied = await client.query<{ name: string }>(
      `select name from drizzle."__migrations"`,
    );
    const appliedNames = new Set(applied.rows.map((r) => r.name));

    let count = 0;
    for (const file of files) {
      if (appliedNames.has(file)) {
        console.log(`skip  ${file}`);
        continue;
      }
      const sql = await readFile(path.join(dir, file), "utf8");
      const hash = (await import("node:crypto"))
        .createHash("sha256")
        .update(sql)
        .digest("hex");

      console.log(`apply ${file}`);
      await client.query("BEGIN");
      try {
        // Split on drizzle's statement breakpoints plus plain semicolons
        // outside of function bodies (drizzle-kit emits --> statement-breakpoint).
        const statements = sql.includes("--> statement-breakpoint")
          ? sql.split("--> statement-breakpoint")
          : [sql];
        for (const statement of statements) {
          const trimmed = statement.trim();
          if (!trimmed) continue;
          await client.query(trimmed);
        }
        await client.query(
          `insert into drizzle."__migrations" (hash, name) values ($1, $2)`,
          [hash, file],
        );
        await client.query("COMMIT");
        count += 1;
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`FAILED ${file}`);
        throw error;
      }
    }

    console.log(
      count === 0
        ? "Database is up to date."
        : `Applied ${count} migration(s).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("[migrate] error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
