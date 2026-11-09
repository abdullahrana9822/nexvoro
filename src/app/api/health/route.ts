import { checkDatabaseConnection } from "@/db";
import { jsonOk } from "@/lib/utils";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + readiness probe. Used by the deployment smoke test.
 * Never exposes connection strings or credentials.
 */
export async function GET() {
  const db = await checkDatabaseConnection();
  const body = {
    service: "nexvoro",
    status: db.ok ? "ok" : "degraded",
    environment: env.NODE_ENV,
    database: {
      connected: db.ok,
      latencyMs: db.latencyMs,
      // Actionable, secret-free explanation when the database is unreachable.
      reason: db.ok ? undefined : db.error,
    },
    integrations: {
      onlinePayments: Boolean(env.PAYMENT_GATEWAY_SECRET && env.PAYMENT_GATEWAY_PROVIDER),
      email: Boolean(env.EMAIL_SERVICE_KEY),
      automations: Boolean(env.CRON_SECRET),
    },
    timestamp: new Date().toISOString(),
  };
  return jsonOk(body, db.ok ? 200 : 503);
}
