"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, Package, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { formatDate } from "@/lib/utils";

type PendingOrder = {
  id: string;
  orderNumber: string;
  expectedDeliveryAt: string | null;
};

/**
 * YES / NO delivery confirmation.
 *
 * YES  -> order becomes DELIVERED (progress 100%).
 * NO   -> order becomes DISPUTED and admins are alerted.
 * Nothing is ever auto-confirmed.
 */
export function DeliveryConfirmationGate({ order }: { order: PendingOrder }) {
  const [visible, setVisible] = useState(true);
  const [mode, setMode] = useState<"question" | "reason" | "done">("question");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function confirmDelivery() {
    setLoading(true);
    try {
      const response = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not confirm delivery");
      setMode("done");
      toast({
        tone: "success",
        title: "Delivery confirmed",
        description: "Thanks! Your order is now marked as delivered.",
      });
      window.setTimeout(() => {
        setVisible(false);
        router.refresh();
      }, 1600);
    } catch (error) {
      toast({
        tone: "error",
        title: "Something went wrong",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  async function reportNotReceived() {
    if (reason.trim().length < 5) return;
    setLoading(true);
    try {
      const response = await fetch("/api/orders/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, reason: reason.trim() }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(json.error ?? "Could not submit your report");
      setMode("done");
      toast({
        tone: "info",
        title: "Report received",
        description: json.message,
      });
      window.setTimeout(() => {
        setVisible(false);
        router.refresh();
      }, 1800);
    } catch (error) {
      toast({
        tone: "error",
        title: "Something went wrong",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[85] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-confirm-title"
          aria-describedby="delivery-confirm-desc"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lifted"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Package className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 id="delivery-confirm-title" className="text-sm font-bold text-fg">
                    Did your order arrive?
                  </h2>
                  <p className="text-[11px] text-fg-subtle">Order {order.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="rounded-md p-1 text-fg-subtle transition hover:bg-bg-muted hover:text-fg"
                aria-label="Ask me later"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="px-5 py-5">
              {mode === "question" ? (
                <>
                  <p id="delivery-confirm-desc" className="text-sm leading-relaxed text-fg-muted">
                    Your parcel was expected by{" "}
                    <strong className="font-semibold text-fg">
                      {order.expectedDeliveryAt ? formatDate(order.expectedDeliveryAt) : "now"}
                    </strong>
                    . Please confirm so we can close the order.
                  </p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={confirmDelivery}
                      disabled={loading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <CheckCircle2 className="size-4" aria-hidden />
                      )}
                      Yes, it arrived
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("reason")}
                      disabled={loading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold text-fg transition hover:border-danger hover:text-danger disabled:opacity-60"
                    >
                      <AlertTriangle className="size-4" aria-hidden />
                      No, not yet
                    </button>
                  </div>
                </>
              ) : null}

              {mode === "reason" ? (
                <>
                  <label htmlFor="dispute-reason" className="text-sm font-semibold text-fg">
                    Tell us what happened
                  </label>
                  <textarea
                    id="dispute-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    placeholder="The courier marked it delivered but nothing arrived…"
                    className="mt-2 w-full rounded-xl border border-border bg-bg-elevated p-3 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("question")}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-border text-sm font-semibold text-fg"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={reportNotReceived}
                      disabled={loading || reason.trim().length < 5}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-danger text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                      Send report
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-fg-subtle">
                    Our team is alerted immediately and will contact you within one business day.
                  </p>
                </>
              ) : null}

              {mode === "done" ? (
                <div className="py-4 text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
                    <CheckCircle2 className="size-6" aria-hidden />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-fg">All done — thank you.</p>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
