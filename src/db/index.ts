import "server-only";
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

function createPool(): Pool {
  const connectionString = env.DATABASE_URL;
  const isServerless = Boolean(process.env.VERCEL);

  const pool = new Pool({
    connectionString,
    max: isServerless ? 3 : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    // Managed providers (Neon, Supabase, RDS) require TLS in production.
    ssl:
      /localhost|127\.0\.0\.1|::1/.test(connectionString) ||
      connectionString.includes("sslmode=disable")
        ? undefined
        : { rejectUnauthorized: false },
  });

  pool.on("error", (error) => {
    console.error("[db] unexpected idle client error", error.message);
  });

  return pool;
}

export const pool: Pool = globalForDb.__nexvoroPool ?? createPool();

if (!env.isProduction) {
  globalForDb.__nexvoroPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;

/** Lightweight connectivity probe used by /api/health and the admin panel. */
export async function checkDatabaseConnection(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const started = Date.now();
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
