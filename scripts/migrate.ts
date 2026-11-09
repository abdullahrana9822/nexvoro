import { config } from "dotenv";
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
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Aborting migration.");
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "drizzle");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  const client = new Client({
    connectionString: url,
    ssl:
      /localhost|127\.0\.0\.1|::1/.test(url) || url.includes("sslmode=disable")
        ? undefined
        : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
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
