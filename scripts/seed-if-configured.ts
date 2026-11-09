import "./load-env";
import { spawnSync } from "node:child_process";

/**
 * Deploy-time seeding gate.
 *
 * Runs the demo catalogue seed only when SEED_ON_DEPLOY=1. The seed itself
 * refuses to touch a database that already holds products or orders, so this
 * can never wipe live data — it is opt-in and one-shot by construction.
 */
function main() {
  if (process.env.SEED_ON_DEPLOY !== "1") {
    console.log("[seed] skipped (SEED_ON_DEPLOY is not 1)");
    return;
  }

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log("[seed] skipped (SEED_ADMIN_PASSWORD is not set)");
    return;
  }

  console.log("[seed] SEED_ON_DEPLOY=1 — running catalogue seed");
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/seed.ts"],
    { stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) {
    console.error("[seed] seed step failed");
    process.exit(result.status ?? 1);
  }
}

main();
