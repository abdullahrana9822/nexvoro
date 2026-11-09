import { resolveDatabaseUrl, resolveDirectUrl } from "@/lib/db-url";
import "server-only";

type EnvSource = Record<string, string | undefined>;

export function read(source: EnvSource, key: string): string | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

/**
 * Central, validated environment access.
 *
 * Secrets are only ever read on the server. Nothing here is re-exported to
 * client components, and no value uses the NEXT_PUBLIC_ prefix except
 * NEXT_PUBLIC_APP_URL (which is intentionally public).
 */
export const env = {
  get DATABASE_URL(): string {
    const url = resolveDatabaseUrl();
    if (!url) {
      throw new Error(
        "No database connection string found. Set DATABASE_URL (or POSTGRES_URL from the Supabase integration).",
      );
    }
    return url;
  },
  get AUTH_SECRET(): string {
    return requireEnv("AUTH_SECRET");
  },
  /**
   * Optional direct (non-pooled) connection string.
   *
   * Supabase's transaction pooler (port 6543) does not support prepared
   * statements or long-lived DDL sessions, so migrations should use the direct
   * connection on port 5432. When DIRECT_URL is absent we fall back to
   * DATABASE_URL, which is correct for local Postgres and Neon.
   */
  get DIRECT_URL(): string {
    return resolveDirectUrl() ?? this.DATABASE_URL;
  },
  get NEXT_PUBLIC_APP_URL(): string {
    const url =
      read(process.env, "NEXT_PUBLIC_APP_URL") ??
      (read(process.env, "VERCEL_PROJECT_PRODUCTION_URL")
        ? `https://${read(process.env, "VERCEL_PROJECT_PRODUCTION_URL")}`
        : undefined) ??
      (read(process.env, "VERCEL_URL")
        ? `https://${read(process.env, "VERCEL_URL")}`
        : undefined) ??
      "http://localhost:3000";
    return url.replace(/\/$/, "");
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV ?? "development";
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
  /** Optional integrations — reported honestly in the deployment report. */
  get PAYMENT_GATEWAY_PROVIDER(): string | undefined {
    return read(process.env, "PAYMENT_GATEWAY_PROVIDER");
  },
  get PAYMENT_GATEWAY_SECRET(): string | undefined {
    return read(process.env, "PAYMENT_GATEWAY_SECRET");
  },
  get EMAIL_SERVICE_KEY(): string | undefined {
    return read(process.env, "EMAIL_SERVICE_KEY");
  },
  get SEED_ADMIN_EMAIL(): string {
    return read(process.env, "SEED_ADMIN_EMAIL") ?? "admin@nexvoro.com";
  },
  get SEED_ADMIN_PASSWORD(): string {
    return read(process.env, "SEED_ADMIN_PASSWORD") ?? "";
  },
  get CRON_SECRET(): string | undefined {
    return read(process.env, "CRON_SECRET");
  },
};

export function requireEnv(key: string): string {
  const value = read(process.env, key);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. See .env.example.`,
    );
  }
  return value;
}

export function optionalEnv(key: string): string | undefined {
  return read(process.env, key);
}

/** True when every listed variable is present and non-empty. */
export function hasEnv(...keys: string[]): boolean {
  return keys.every((key) => Boolean(read(process.env, key)));
}
