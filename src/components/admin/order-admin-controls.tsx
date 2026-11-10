"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { ORDER_STAGES, STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/db/schema";

const ALL_STATUSES: OrderStatus[] = [
  ...ORDER_STAGES.map((stage) => stage.status),
  "DELIVERED",
  "DISPUTED",
  "CANCELLED",
  "RETURNED",
];

const PAYMENT_STATUSES = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "COD_DUE",
] as const;

export function OrderAdminControls({
  orderId,
  currentStatus,
  currentPaymentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus: string;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function save() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
          paymentStatus,
          message: message || undefined,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not update the order");
      toast({ tone: "success", title: "Order updated and customer notified" });
      setMessage("");
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Update failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel p-5">
      <h2 className="text-sm font-bold text-fg">Admin override</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
        Setting the status to Delivered completes the order at 100%. Automation never does this
        on its own; every manual change is written to the audit log and the customer is notified.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="admin-status" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
            Order status
          </label>
          <select
            id="admin-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
            className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs font-semibold text-fg focus:border-brand focus:outline-none"
          >
            {ALL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]} ({value})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-payment" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
            Payment status
          </label>
          <select
            id="admin-payment"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs font-semibold text-fg focus:border-brand focus:outline-none"
          >
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-note" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
            Note to customer (optional)
          </label>
          <textarea
            id="admin-note"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            maxLength={300}
            className="w-full rounded-xl border border-border bg-bg-elevated p-2.5 text-xs focus:border-brand focus:outline-none"
            placeholder="Courier delay, replacement arranged…"
          />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand text-xs font-bold text-brand-fg disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          Apply update
        </button>
      </div>
    </div>
  );
}
