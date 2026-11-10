import "./load-env";
import { runOrderAutomation } from "../src/lib/orders";
import { recordAudit } from "../src/lib/activity";

/**
 * Standalone order-lifecycle worker.
 *
 * Use this for a long-running host (VPS, Railway, Render) or a cron entry:
 *   npm run worker            # one pass
 *   every 15 minutes: npm run worker --silent >> /var/log/nexvoro-worker.log 2>&1
 *
 * On Vercel the same logic is called hourly by the cron job defined in
 * vercel.json (GET /api/worker with a CRON_SECRET bearer token).
 */
async function main() {
  const startedAt = Date.now();
  const summary = await runOrderAutomation();

  await recordAudit({
    action: "worker.order_automation",
    entity: "system",
    meta: {
      source: "cli",
      scanned: summary.scanned,
      advanced: summary.advanced,
      escalated: summary.escalated,
      skipped: summary.skipped,
    },
  });

  const details = (summary.details ?? [])
    .map((item) => `  ${item.orderNumber}: ${item.from} -> ${item.to}`)
    .join("\n");

  console.log(
    [
      `[worker] scanned=${summary.scanned} advanced=${summary.advanced} escalated=${summary.escalated} skipped=${summary.skipped}`,
      details,
      `[worker] finished in ${Date.now() - startedAt}ms`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

main().catch((error) => {
  console.error("[worker] error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
