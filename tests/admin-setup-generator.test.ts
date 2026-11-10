import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("owner bootstrap credential generator", () => {
  it("keeps the token private, prints only its digest, and refuses replacement", () => {
    const dir = mkdtempSync(join(tmpdir(), "nexvoro-setup-test-"));
    try {
      const script = resolve("scripts/create-admin-setup.mjs");
      const run = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
      expect(run.status).toBe(0);
      const path = join(dir, ".admin-setup.json");
      const raw = readFileSync(path, "utf8");
      const secret = JSON.parse(raw) as { token: string; expiresAt: string };
      expect(secret.token).toMatch(/^[a-f0-9]{64}$/);
      expect(run.stdout.includes(secret.token)).toBe(false);
      expect(run.stderr.includes(secret.token)).toBe(false);
      expect(run.stdout).toContain(createHash("sha256").update(secret.token).digest("hex"));
      expect(statSync(path).mode & 0o777).toBe(0o600);
      expect(Date.parse(secret.expiresAt)).toBeGreaterThan(Date.now());
      const repeated = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
      expect(repeated.status).not.toBe(0);
      expect(readFileSync(path, "utf8")).toBe(raw);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
