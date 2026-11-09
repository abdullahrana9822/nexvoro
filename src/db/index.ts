import "server-only";
import { resolveDatabaseUrl } from "@/lib/db-url";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "@/lib/env";

/**
 * A single pooled connection per server process.
 *
 * In serverless environments the pool must stay small; node-postgres is
 * initialised lazily and cached on globalThis so hot reloads in development
 * never leak connections.
 */
const globalForDb = globalThis as unknown as {
  __nexvoroPool?: Pool;
};

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

function createPool(): Pool {

  const connectionString = env.DATABASE_URL;
  const isServerless = Boolean(process.env.VERCEL);

  const isLocal =
    /localhost|127\.0\.0\.1|::1/.test(connectionString) ||
    connectionString.includes("sslmode=disable");

  // Managed Postgres (Supabase, Neon, RDS) presents a CA that is absent from the
  // runtime trust store, which Node rejects with "self-signed certificate in
  // certificate chain". Traffic stays TLS-encrypted; verification is relaxed
  // because the certificate cannot be chained to a known root in this
  // container. sslmode is removed from the URL so pg-connection-string cannot
  // override the explicit ssl option below.
  const pool = new Pool({
    connectionString: isLocal ? connectionString : stripSslParams(connectionString),
    max: isServerless ? 3 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });

  pool.on("error", (error) => {
    console.error("[db] unexpected idle client error", error.message);
  });

  return pool;
}

/**
 * The pool is created on first use, never at module import time.
 *
 * Next.js imports every route module while collecting page data during a
 * build, so a connection attempt at import time would make `next build`
 * require a live database (and fail on CI/Vercel where DATABASE_URL may not be
 * present at build time). Deferring also means a build never opens sockets.
 */
function getPool(): Pool {
  if (globalForDb.__nexvoroPool) return globalForDb.__nexvoroPool;
  const created = createPool();
  globalForDb.__nexvoroPool = created;
  return created;
}

const poolProxy = new Proxy({} as Pool, {
  get(_target, property) {
    const instance = getPool() as unknown as Record<PropertyKey, unknown>;
    const value = instance[property];
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has(_target, property) {
    return property in (getPool() as unknown as object);
  },
});

/** Shared connection pool (created lazily on first query). */
export const pool: Pool = poolProxy;

export const db = drizzle({
  client: poolProxy,
  schema,
});

export type Database = typeof db;

/** Lightweight connectivity probe used by /api/health and the admin panel. */
export async function checkDatabaseConnection(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const started = Date.now();
  if (!resolveDatabaseUrl()) {
    return {
      ok: false,
      latencyMs: 0,
      error:
        "No database connection string is set on this deployment (DATABASE_URL / POSTGRES_URL). See .env.example.",
    };
  }
  try {
    const client = await pool.connect();
    try {
      await client.query("select 1");
    } finally {
      client.release();
    }
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}
