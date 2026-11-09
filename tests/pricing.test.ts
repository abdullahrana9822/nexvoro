import { describe, expect, it } from "vitest";
import { computeShipping, computeSubtotal, computeTotals, evaluateCoupon } from "@/lib/pricing";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT_RATE } from "@/lib/constants";

const plan = { id: "plan-1", name: "Standard", price: "2500", freeOver: "150000" };

describe("subtotal", () => {
  it("multiplies price by quantity and ignores negative quantities", () => {
    expect(
      computeSubtotal([
        { unitPrice: "249999.00", quantity: 2 },
        { unitPrice: 1000, quantity: -3 },
      ]),
    ).toBe(499998);
  });
});

describe("coupon evaluation", () => {
  it("applies a percentage discount", () => {
    const result = evaluateCoupon(
      { code: "NEX10", type: "PERCENTAGE", value: "10", minSubtotal: "0" },
      100000,
    );
    expect(result).toEqual({ ok: true, discount: 10000, freeShipping: false });
  });

  it("applies a fixed discount", () => {
    const result = evaluateCoupon(
      { code: "FLAT5000", type: "FIXED", value: "5000", minSubtotal: "50000" },
      60000,
    );
    expect(result).toEqual({ ok: true, discount: 5000, freeShipping: false });
  });

  it("caps a percentage discount at maxDiscount", () => {
    const result = evaluateCoupon(
      { code: "BIG", type: "PERCENTAGE", value: "50", maxDiscount: "10000" },
      100000,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount).toBe(10000);
  });

  it("rejects baskets below the minimum subtotal", () => {
    const result = evaluateCoupon(
      { code: "NEX10", type: "PERCENTAGE", value: "10", minSubtotal: "50000" },
      49999,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("50,000");
  });

  it("never discounts below zero", () => {
    const result = evaluateCoupon(
      { code: "HUGE", type: "FIXED", value: "999999" },
      1000,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount).toBe(1000);
  });

  it("handles a missing coupon", () => {
    expect(evaluateCoupon(null, 1000).ok).toBe(false);
  });
});

describe("shipping", () => {
  it("charges the plan rate below the free-shipping threshold", () => {
    const result = computeShipping(149999, plan);
    expect(result.shipping).toBe(SHIPPING_FLAT_RATE);
    expect(result.freeShippingRemaining).toBe(1);
  });

  it("is free at and above the threshold", () => {
    expect(computeShipping(FREE_SHIPPING_THRESHOLD, plan).shipping).toBe(0);
    expect(computeShipping(500000, plan).shipping).toBe(0);
  });

  it("lets a FREESHIP coupon zero the shipping line", () => {
    const result = computeShipping(1000, plan, {
      code: "freeship",
      type: "FIXED",
      value: 0,
    });
    expect(result.shipping).toBe(0);
  });

  it("falls back to the flat rate with no plan", () => {
    expect(computeShipping(1000, null).shipping).toBe(SHIPPING_FLAT_RATE);
  });
});

describe("cart totals", () => {
  it("computes subtotal, discount, shipping and total together", () => {
    const totals = computeTotals({
      lines: [{ unitPrice: "100000", quantity: 2 }],
      coupon: { code: "NEX10", type: "PERCENTAGE", value: "10", minSubtotal: "0" },
      plan,
    });
    expect(totals.subtotal).toBe(200000);
    expect(totals.discount).toBe(20000);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(180000);
    expect(totals.itemCount).toBe(2);
  });

  it("charges shipping after the discount drops the basket below the threshold", () => {
    const totals = computeTotals({
      lines: [{ unitPrice: "160000", quantity: 1 }],
      coupon: { code: "FLAT5000", type: "FIXED", value: "20000", minSubtotal: "0" },
      plan,
    });
    expect(totals.shipping).toBe(SHIPPING_FLAT_RATE);
    expect(totals.total).toBe(140000 + SHIPPING_FLAT_RATE);
  });

  it("returns a zeroed basket when empty", () => {
    const totals = computeTotals({ lines: [] });
    expect(totals.subtotal).toBe(0);
    expect(totals.itemCount).toBe(0);
    expect(totals.total).toBe(0);
  });

  it("applies a tax rate when one is configured", () => {
    const totals = computeTotals({
      lines: [{ unitPrice: "10000", quantity: 1 }],
      plan: { ...plan, freeOver: "1" },
      taxRate: 5,
    });
    expect(totals.tax).toBe(500);
    expect(totals.total).toBe(10500);
  });
});
