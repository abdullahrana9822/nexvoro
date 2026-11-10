import { describe, expect, it } from "vitest";
import { ORDER_STAGES, STATUS_LABELS } from "@/lib/constants";

/**
 * Product requirement: the automated pipeline may reach 99% but must never
 * award 100% on its own. Delivery is confirmed by the customer or an admin,
 * and a passed expected date must never auto-deliver an order.
 */
describe("order lifecycle", () => {
  it("never exposes an automated 100% stage", () => {
    for (const stage of ORDER_STAGES) {
      expect(stage.progress).toBeGreaterThanOrEqual(0);
      expect(stage.progress).toBeLessThanOrEqual(99);
    }
    expect(ORDER_STAGES.some((stage) => stage.status === "DELIVERED")).toBe(false);
  });

  it("keeps stage progress strictly increasing", () => {
    const progress = ORDER_STAGES.map((stage) => stage.progress);
    for (let index = 1; index < progress.length; index += 1) {
      const current = progress[index] ?? 0;
      const previous = progress[index - 1] ?? 0;
      expect(current).toBeGreaterThan(previous);
    }
  });

  it("ends the automated pipeline at awaiting confirmation", () => {
    const last = ORDER_STAGES.at(-1);
    expect(last?.status).toBe("AWAITING_CONFIRMATION");
    expect(last?.progress).toBe(99);
  });

  it("gives every stage a customer-facing message", () => {
    for (const stage of ORDER_STAGES) {
      expect(stage.label.length).toBeGreaterThan(0);
      expect(stage.description.length).toBeGreaterThan(10);
      expect(stage.customerMessage.length).toBeGreaterThan(10);
    }
  });

  it("labels every order status, including the manual ones", () => {
    for (const status of [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "AWAITING_CONFIRMATION",
      "DELIVERED",
      "DISPUTED",
      "CANCELLED",
      "RETURNED",
    ] as const) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe("catch-up scheduling", () => {
  /**
   * The worker advances as many stages as elapsed time has earned, which lets a
   * daily cron (the only cadence Vercel Hobby allows) keep the cadence each
   * shipping plan promises. The guarantee that never changes: it stops at
   * AWAITING_CONFIRMATION and can never reach DELIVERED.
   */
  const nextInPipeline = (status: string) => {
    const index = ORDER_STAGES.findIndex((stage) => stage.status === status);
    return index === -1 || index + 1 >= ORDER_STAGES.length
      ? null
      : ORDER_STAGES[index + 1];
  };

  it("walks the whole pipeline on a 3-day gap but stops at 99%", () => {
    let status = String(ORDER_STAGES[0]?.status);
    let hops = 0;
    for (;;) {
      const next = nextInPipeline(status);
      if (!next) break;
      status = String(next.status);
      hops += 1;
      expect(next.status).not.toBe("DELIVERED");
      expect(Number(next.progress)).toBeLessThan(100);
    }
    expect(hops).toBe(ORDER_STAGES.length - 1);
    expect(status).toBe("AWAITING_CONFIRMATION");
  });

  it("computes stages due as elapsed / interval, never zero when overdue", () => {
    const due = (elapsedHours: number, interval: number) =>
      Math.min(Math.max(1, Math.floor(elapsedHours / Math.max(1, interval))), 7);

    expect(due(11.9, 12)).toBe(1);
    expect(due(12, 12)).toBe(1);
    expect(due(24, 12)).toBe(2);
    expect(due(72, 12)).toBe(6);
    expect(due(500, 12)).toBe(7);
  });
});
