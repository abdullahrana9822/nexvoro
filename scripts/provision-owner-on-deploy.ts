import "./load-env";
import { spawnSync } from "node:child_process";
/** Explicit, short-lived production-only operator configuration. Never logged. */
const raw =
  process.env.OWNER_PROVISIONING_JSON ??
  (process.env.OWNER_PROVISIONING_PASSWORD
    ? JSON.stringify({
        username: process.env.OWNER_PROVISIONING_USERNAME,
        email: process.env.OWNER_PROVISIONING_EMAIL,
        password: process.env.OWNER_PROVISIONING_PASSWORD,
      })
    : undefined);
if (!raw || process.env.VERCEL_ENV !== "production") {
  console.log("[owner] private production provisioning is not enabled");
} else {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (
      !["username", "email", "password"].every(
        (key) => typeof value[key] === "string",
      )
    )
      throw new Error();
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/provision-owner.ts"],
      {
        env: {
          ...process.env,
          OWNER_USERNAME: String(value.username),
          OWNER_EMAIL: String(value.email),
          OWNER_TEMP_PASSWORD: String(value.password),
          CONFIRM_PRODUCTION_OWNER: "CREATE_ONCE",
          OWNER_IDEMPOTENT_DEPLOY: "1",
        },
        stdio: "inherit",
      },
    );
    if (result.status !== 0) process.exit(result.status ?? 1);
  } catch {
    console.error(
      "[owner] invalid private provisioning configuration; no credentials logged",
    );
    process.exit(1);
  }
}
