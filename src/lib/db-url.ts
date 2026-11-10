/**
 * Resolves the PostgreSQL connection strings from whichever naming convention
 * the hosting platform uses.
 *
 * Vercel's Supabase integration does not inject `DATABASE_URL`; it injects its
 * own set of `POSTGRES_*` / `SUPABASE_*` variables. Reading only `DATABASE_URL`
 * was the reason the deployed app reported "database not configured" while a
 * database was in fact attached to the project. This module accepts both.
 *
 * Pooled (transaction pooler, port 6543) is used for runtime queries; direct
 * (port 5432) is used for migrations, which the pooler cannot run.
 */

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  // Guard against unexpanded template placeholders such as "<PASSWORD>".
  if (trimmed.includes("<") || trimmed.includes(">")) return undefined;
  return trimmed;
}

function pick(source: Record<string, string | undefined>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = clean(source[key]);
    if (value) return value;
  }
  return undefined;
}

const POOLED_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL", // pooled + pgbouncer flags
  "SUPABASE_DB_URL",
  "POSTGRES_URL_POOLING",
];

const DIRECT_KEYS = [
  "DIRECT_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NO_POOLING",
];

/** Runtime connection string (prefers the pooler). */
export function resolveDatabaseUrl(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  return pick(source, POOLED_KEYS) ?? pick(source, DIRECT_KEYS);
}

/** Migration connection string (prefers the direct, non-pooled endpoint). */
export function resolveDirectUrl(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  return pick(source, DIRECT_KEYS) ?? pick(source, POOLED_KEYS);
}

/** Supabase project URL, from either our name or the integration's name. */
export function resolveSupabaseUrl(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  const explicit = pick(source, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]);
  if (explicit) return explicit;

  // The integration also exposes the bare host, e.g. "db.<ref>.supabase.co".
  const host = pick(source, ["POSTGRES_HOST", "SUPABASE_HOST"]);
  if (!host) return undefined;
  const match = /(?:^|\.)([a-z0-9]{20})\.supabase\.(?:co|com)$/i.exec(host);
  return match ? `https://${match[1]}.supabase.co` : undefined;
}

export function resolveSupabaseAnonKey(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  return pick(source, [
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
  ]);
}

export function resolveSupabaseServiceKey(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  return pick(source, ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"]);
}

/** Names of the connection variables that were found, for health diagnostics. */
export function databaseUrlSource(
  source: Record<string, string | undefined> = process.env,
): string | null {
  const key = POOLED_KEYS.concat(DIRECT_KEYS).find((name) => clean(source[name]));
  return key ?? null;
}
