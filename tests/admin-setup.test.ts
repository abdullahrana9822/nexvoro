import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { adminSetupSchema, validAdminSetupToken } from "@/lib/admin-setup";
import { hasRole } from "@/lib/auth";

const token = "a".repeat(64); // Deliberately public test fixture, never a real token.
const now = Date.now();
const source = {
  ADMIN_SETUP_TOKEN_SHA256: createHash("sha256").update(token).digest("hex"),
  ADMIN_SETUP_EXPIRES_AT: new Date(now + 60_000).toISOString(),
};

describe("first Super Admin setup security", () => {
  it("is disabled without configured owner credentials", () => {
    expect(validAdminSetupToken(token, {}, now)).toBe(false);
  });
  it("requires an expiry as well as the token digest", () => {
    expect(validAdminSetupToken(token, { ADMIN_SETUP_TOKEN_SHA256: source.ADMIN_SETUP_TOKEN_SHA256 }, now)).toBe(false);
  });
  it("rejects expired and malformed expiry windows", () => {
    expect(validAdminSetupToken(token, source, now + 60_001)).toBe(false);
    expect(validAdminSetupToken(token, { ...source, ADMIN_SETUP_EXPIRES_AT: "invalid" }, now)).toBe(false);
  });
  it("accepts only the correct token before expiry", () => {
    expect(validAdminSetupToken(token, source, now)).toBe(true);
    expect(validAdminSetupToken("b".repeat(64), source, now)).toBe(false);
    expect(validAdminSetupToken("a", source, now)).toBe(false);
  });
  it("rejects malformed configured digests without throwing", () => {
    expect(validAdminSetupToken(token, { ...source, ADMIN_SETUP_TOKEN_SHA256: "garbage" }, now)).toBe(false);
  });
  it("requires 20-character strong passwords with symbols", () => {
    for (const password of ["short", "Nexvoro!Admin2026", "a".repeat(24), "AReallyLongPassword123"]) {
      expect(adminSetupSchema.safeParse({ token, password }).success).toBe(false);
    }
    expect(adminSetupSchema.safeParse({ token, password: "Example-Strong-Test-Only-123!" }).success).toBe(true);
  });
  it("Super Admin inherits all existing dashboard privileges", () => {
    for (const role of ["CUSTOMER", "STAFF", "ADMIN", "SUPER_ADMIN"] as const) expect(hasRole("SUPER_ADMIN", role)).toBe(true);
    expect(hasRole("CUSTOMER", "ADMIN")).toBe(false);
    expect(hasRole("ADMIN", "SUPER_ADMIN")).toBe(false);
  });
});
