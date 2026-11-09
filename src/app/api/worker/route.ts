import { safeCompare } from "@/lib/auth";
import { runOrderAutomation } from "@/lib/orders";
import { handleError } from "@/lib/api";
import { jsonError, jsonOk } from "@/lib/utils";
import { env } from "@/lib/env";
import { recordAudit } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Automated order lifecycle worker.
 *
 * Triggered by a Vercel Cron Job (see vercel.json) or any external scheduler.
 * Protected by a bearer CRON_SECRET so it cannot be triggered by the public.
 */
async function handle(request: Request): Promise<Response> {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return jsonError("CRON_SECRET is not configured on this deployment", 503);
  }

  const authorization = request.headers.get("authorization") ?? "";
  const provided =
    authorization.replace(/^Bearer\s+/i, "") ||
    request.headers.get("x-cron-secret") ||
    new URL(request.url).searchParams.get("secret") ||
    "";

  if (!provided || !safeCompare(provided, secret)) {
    return jsonError("Unauthorized", 401);
  }

  const summary = await runOrderAutomation();

  await recordAudit({
    action: "worker.order_automation",
    entity: "system",
    meta: {
      scanned: summary.scanned,
      advanced: summary.advanced,
      escalated: summary.escalated,
      skipped: summary.skipped,
    },
  });

  return jsonOk({ summary });
}

export async function GET(request: Request) {
  try {
    return await handle(request);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    return await handle(request);
  } catch (error) {
    return handleError(error);
  }
}
