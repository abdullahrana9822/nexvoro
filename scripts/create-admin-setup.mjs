import { randomBytes, createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

// Run on the OWNER'S computer, not a shared CI/deployment machine.
// Token never appears in terminal output. Refuse to overwrite an existing file.
const token = randomBytes(32).toString("hex");
const digest = createHash("sha256").update(token).digest("hex");
const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString();
writeFileSync(".admin-setup.json", JSON.stringify({ token, expiresAt }, null, 2), {
  encoding: "utf8", mode: 0o600, flag: "wx",
});
console.log("Private token saved to .admin-setup.json (owner access only). Do not share or commit it.");
console.log(`ADMIN_SETUP_TOKEN_SHA256=${digest}`);
console.log(`ADMIN_SETUP_EXPIRES_AT=${expiresAt}`);
console.log("Configure these two values in Vercel Production, redeploy, then open /admin-setup.");
console.log("Enter the token from the private file and choose your password there. Delete the file and remove the two variables after setup.");
