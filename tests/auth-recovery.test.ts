import "../scripts/load-env";
import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation";
import { passwordStrength } from "@/lib/password-strength";

describe("password reset payloads", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
  });

  it("rejects short reset tokens", () => {
    expect(
      resetPasswordSchema.safeParse({ token: "abc", password: "Nexvoro!Reset2026" }).success,
    ).toBe(false);
  });

  it("accepts a 64-char hex token with a strong password", () => {
    const token = "a".repeat(64);
    expect(resetPasswordSchema.safeParse({ token, password: "Nexvoro!Reset2026" }).success).toBe(
      true,
    );
  });

  it("still enforces password strength on reset", () => {
    const token = "b".repeat(64);
    expect(resetPasswordSchema.safeParse({ token, password: "weak" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token, password: "alllowercase123" }).success).toBe(
      false,
    );
  });
});

describe("password strength meter", () => {
  it("scores stronger passwords higher", () => {
    expect(passwordStrength("abc").score).toBe(0);
    expect(passwordStrength("Nexvoro!Demo2026").score).toBeGreaterThanOrEqual(3);
  });

  it("returns a human label", () => {
    expect(passwordStrength("Nexvoro!Demo2026").label.length).toBeGreaterThan(0);
  });
});
