import { describe, expect, it } from "vitest";
import {
  addressSchema,
  cartAddSchema,
  contactSchema,
  passwordSchema,
  productQuerySchema,
  registerSchema,
} from "@/lib/validation";

describe("product query parsing", () => {
  it("accepts an empty query", () => {
    const parsed = productQuerySchema.parse({});
    expect(parsed.page).toBeUndefined();
    expect(parsed.sort).toBeUndefined();
  });

  it("coerces paging and price filters from query strings", () => {
    const parsed = productQuerySchema.parse({
      page: "3",
      min: "1000",
      max: "50000",
      rating: "4",
      sort: "price-asc",
    });
    expect(parsed.page).toBe(3);
    expect(parsed.min).toBe(1000);
    expect(parsed.max).toBe(50000);
    expect(parsed.rating).toBe(4);
    expect(parsed.sort).toBe("price-asc");
  });

  it("rejects an unknown sort option", () => {
    expect(productQuerySchema.safeParse({ sort: "cheapest" }).success).toBe(false);
  });

  it("rejects out-of-range paging and ratings", () => {
    expect(productQuerySchema.safeParse({ page: "1000" }).success).toBe(false);
    expect(productQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(productQuerySchema.safeParse({ rating: "9" }).success).toBe(false);
    expect(productQuerySchema.safeParse({ min: "-100" }).success).toBe(false);
  });

  it("only accepts literal true/false for boolean flags", () => {
    expect(productQuerySchema.safeParse({ deals: "true" }).success).toBe(true);
    expect(productQuerySchema.safeParse({ deals: "yes" }).success).toBe(false);
  });
});

describe("registration validation", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Nexvoro!Demo2026").success).toBe(true);
  });

  it("rejects short or single-case passwords", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase123").success).toBe(false);
  });

  it("normalises the email to lowercase", () => {
    const result = registerSchema.safeParse({
      firstName: "Aisha",
      lastName: "Khan",
      email: "Aisha@Example.com",
      password: "Nexvoro!Demo2026",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("aisha@example.com");
  });

  it("rejects a malformed email", () => {
    expect(
      registerSchema.safeParse({
        firstName: "Aisha",
        lastName: "Khan",
        email: "not-an-email",
        password: "Nexvoro!Demo2026",
      }).success,
    ).toBe(false);
  });
});

describe("checkout and contact payloads", () => {
  it("validates a Pakistani address", () => {
    const result = addressSchema.safeParse({
      fullName: "Aisha Khan",
      phone: "+923001234567",
      line1: "12 Model Town",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
      country: "Pakistan",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a too-short contact message", () => {
    expect(
      contactSchema.safeParse({
        name: "Ali",
        email: "ali@example.com",
        message: "hi",
      }).success,
    ).toBe(false);
  });

  it("blocks non-positive cart quantities", () => {
    expect(
      cartAddSchema.safeParse({ productId: "3f2b6c4e-0000-4000-8000-000000000000", quantity: -1 })
        .success,
    ).toBe(false);
    expect(
      cartAddSchema.safeParse({ productId: "3f2b6c4e-0000-4000-8000-000000000000", quantity: 2 })
        .success,
    ).toBe(true);
  });
});
