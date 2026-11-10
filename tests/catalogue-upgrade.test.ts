import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { CATALOGUE_CANDIDATES } from "@/lib/catalogue-candidates";
import { EXPERIENCES } from "@/lib/experiences";
import { loginSchema } from "@/lib/validation";
describe("merchant catalogue preparation", () => {
  it("provides exactly thirty unique candidates across ten categories", () => {
    expect(CATALOGUE_CANDIDATES).toHaveLength(30);
    expect(new Set(CATALOGUE_CANDIDATES.map((p) => p.category)).size).toBe(10);
    expect(new Set(CATALOGUE_CANDIDATES.map((p) => p.sku)).size).toBe(30);
    expect(new Set(CATALOGUE_CANDIDATES.map((p) => p.slug)).size).toBe(30);
  });
  it("identifies illustrative imagery and merchant review without fabricating reviews", () => {
    for (const p of CATALOGUE_CANDIDATES) {
      expect(existsSync(`public${p.image}`)).toBe(true);
      expect(p.description).toContain("not an offer for sale");
      expect(p.description).toContain("not manufacturer product photography");
      expect(p.specs.length).toBeGreaterThan(2);
    }
  });
});
describe("ten visual worlds", () => {
  it("uses distinct identities with working local assets", () => {
    expect(EXPERIENCES).toHaveLength(10);
    expect(new Set(EXPERIENCES.map((x) => x.id)).size).toBe(10);
    for (const x of EXPERIENCES) {
      expect(existsSync(`public${x.image}`)).toBe(true);
      expect(x.category).toMatch(/^[a-z-]+$/);
    }
  });
});
describe("username authentication", () => {
  it("accepts and normalizes usernames and preserves email support", () => {
    expect(
      loginSchema.parse({ email: " Owner_123 ", password: "test" }).email,
    ).toBe("owner_123");
    expect(
      loginSchema.safeParse({ email: "shop@example.com", password: "test" })
        .success,
    ).toBe(true);
  });
  it("rejects SQL fragments, missing identity and oversized input", () => {
    for (const email of ["x' OR 1=1 --", "", "a".repeat(256)])
      expect(loginSchema.safeParse({ email, password: "test" }).success).toBe(
        false,
      );
  });
});
