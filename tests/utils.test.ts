import { describe, expect, it } from "vitest";
import {
  clamp,
  discountPercent,
  formatMoney,
  initials,
  orderNumber,
  slugify,
  toNumber,
  trackingCode,
  truncate,
} from "@/lib/utils";

describe("money helpers", () => {
  it("formats PKR without unnecessary decimals", () => {
    expect(formatMoney(249999)).toContain("249,999");
    expect(formatMoney("1500")).toContain("1,500");
  });

  it("treats null and undefined prices as zero", () => {
    expect(formatMoney(null)).toContain("0");
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber("12.50")).toBe(12.5);
  });

  it("computes a discount percentage", () => {
    expect(discountPercent(80000, 100000)).toBe(20);
    expect(discountPercent("7500", "10000")).toBe(25);
  });

  it("returns null when there is no real discount", () => {
    expect(discountPercent(100000, null)).toBeNull();
    expect(discountPercent(100000, 0)).toBeNull();
    expect(discountPercent(100000, 100000)).toBeNull();
    expect(discountPercent(100000, 90000)).toBeNull();
  });
});

describe("text helpers", () => {
  it("slugifies product names", () => {
    expect(slugify("Zenith Blade Gaming 17")).toBe("zenith-blade-gaming-17");
  });

  it("truncates with an ellipsis and never exceeds the limit", () => {
    expect(truncate("short", 10)).toBe("short");
    const cut = truncate("a".repeat(20), 5);
    expect(cut).toBe("aaaa…");
    expect(cut.length).toBe(5);
  });

  it("builds initials from a full name", () => {
    expect(initials("Aisha Khan")).toBe("AK");
    expect(initials("NEXVORO")).toBe("N");
  });

  it("clamps numbers", () => {
    expect(clamp(120, 0, 99)).toBe(99);
    expect(clamp(-5, 0, 99)).toBe(0);
    expect(clamp(42, 0, 99)).toBe(42);
  });
});

describe("identifier helpers", () => {
  it("creates readable order numbers tied to today's date", () => {
    const value = orderNumber();
    expect(value).toMatch(/^NX-\d{8}-\d{5}$/);
    const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    expect(value.startsWith(`NX-${stamp}-`)).toBe(true);
  });

  it("creates tracking codes without ambiguous characters", () => {
    const code = trackingCode();
    expect(code).toMatch(/^NXTRK[A-HJ-NP-Z2-9]{8}$/);
    expect(code).not.toMatch(/[IO01]/);
  });

  it("does not repeat order numbers back to back", () => {
    expect(orderNumber()).not.toBe(orderNumber());
  });
});
