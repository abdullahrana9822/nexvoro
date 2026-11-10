/**
 * Pure pricing logic. Kept free of I/O so it can be unit tested directly
 * and reused by both the cart drawer and server-side order creation.
 */
import { money, toNumber } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT_RATE } from "@/lib/constants";

export type PricingLine = {
  unitPrice: string | number;
  quantity: number;
};

export type CouponLike = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string | number;
  minSubtotal?: string | number | null;
  maxDiscount?: string | number | null;
};

export type ShippingPlanLike = {
  id: string;
  name: string;
  price: string | number;
  freeOver?: string | number | null;
};

export type CartTotals = {
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingRemaining: number;
};

export function computeSubtotal(lines: PricingLine[]): number {
  return lines.reduce(
    (sum, line) => sum + toNumber(line.unitPrice) * Math.max(0, line.quantity),
    0,
  );
}

export type CouponResult =
  | { ok: true; discount: number; freeShipping: false }
  | { ok: true; discount: number; freeShipping: true }
  | { ok: false; reason: string };

export function evaluateCoupon(
  coupon: CouponLike | null,
  subtotal: number,
): CouponResult {
  if (!coupon) return { ok: false, reason: "Coupon not found." };

  const min = toNumber(coupon.minSubtotal);
  if (subtotal < min) {
    return {
      ok: false,
      reason: `Spend at least ${Math.round(min).toLocaleString()} to use ${coupon.code}.`,
    };
  }

  const raw =
    coupon.type === "PERCENTAGE"
      ? (subtotal * toNumber(coupon.value)) / 100
      : toNumber(coupon.value);

  const cap =
    coupon.maxDiscount === null || coupon.maxDiscount === undefined
      ? null
      : toNumber(coupon.maxDiscount);

  const capped = cap === null ? raw : Math.min(raw, cap);
  const discount = Math.min(subtotal, Math.max(0, capped));

  return { ok: true, discount: round2(discount), freeShipping: false };
}

export function computeShipping(
  subtotalAfterDiscount: number,
  plan: ShippingPlanLike | null,
  coupon: CouponLike | null = null,
): { shipping: number; freeShippingRemaining: number } {
  const base = plan ? toNumber(plan.price) : SHIPPING_FLAT_RATE;
  const threshold = plan?.freeOver ? toNumber(plan.freeOver) : FREE_SHIPPING_THRESHOLD;

  // FREESHIP coupons zero the shipping line entirely.
  if (coupon && coupon.code.toUpperCase() === "FREESHIP") {
    return { shipping: 0, freeShippingRemaining: 0 };
  }

  if (subtotalAfterDiscount >= threshold) {
    return { shipping: 0, freeShippingRemaining: 0 };
  }

  return {
    shipping: round2(Math.min(base, SHIPPING_FLAT_RATE * 4)),
    freeShippingRemaining: round2(threshold - subtotalAfterDiscount),
  };
}

export function computeTotals(input: {
  lines: PricingLine[];
  coupon?: CouponLike | null;
  plan?: ShippingPlanLike | null;
  taxRate?: number;
}): CartTotals {
  const subtotal = round2(computeSubtotal(input.lines));
  const coupon = input.coupon ?? null;

  let discount = 0;
  if (coupon) {
    const result = evaluateCoupon(coupon, subtotal);
    if (result.ok) discount = result.discount;
  }

  const afterDiscount = Math.max(0, round2(subtotal - discount));
  const itemCount = input.lines.reduce((sum, l) => sum + Math.max(0, l.quantity), 0);

  // An empty basket never carries a shipping charge, whatever the plan says.
  const { shipping, freeShippingRemaining } =
    itemCount === 0
      ? { shipping: 0, freeShippingRemaining: 0 }
      : computeShipping(afterDiscount, input.plan ?? null, coupon);

  const taxRate = input.taxRate ?? 0;
  const tax = round2((afterDiscount * taxRate) / 100);
  const total = round2(afterDiscount + shipping + tax);

  return {
    itemCount,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    freeShippingRemaining,
  };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toMoneyString(value: number): string {
  return money(value);
}

/**
 * Progress that the automated pipeline may reach on its own.
 * 100% is reserved for explicit customer confirmation or admin override.
 */
export const MAX_AUTOMATED_PROGRESS = 99;

export function automatedProgress(stageProgress: number): number {
  return Math.min(MAX_AUTOMATED_PROGRESS, Math.max(0, stageProgress));
}
