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
