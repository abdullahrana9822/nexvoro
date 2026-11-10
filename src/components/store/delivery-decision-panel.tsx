"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

/** In-page YES / NO delivery confirmation shown on the order detail page. */
export function DeliveryDecisionPanel({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState<"yes" | "no" | null>(null);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function confirm() {
    setLoading("yes");
    try {
      const response = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not confirm");
      toast({ tone: "success", title: "Delivery confirmed — thank you!" });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not confirm delivery",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(null);
    }
  }

  async function dispute() {
    setLoading("no");
    try {
      const response = await fetch("/api/orders/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(json.error ?? "Could not submit");
      toast({ tone: "info", title: "Report sent", description: json.message });
      setShowReason(false);
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not send report",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand-soft p-5">
      <p className="text-sm font-bold text-brand">Did your order arrive?</p>
      <p className="mt-1 text-xs text-fg-muted">
        We never mark an order as delivered automatically — please confirm so we can close it
        out.
      </p>

      {!showReason ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={confirm}
            disabled={loading !== null}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-xs font-bold text-brand-fg disabled:opacity-60"
          >
            {loading === "yes" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden />
            )}
            Yes, it arrived
          </button>
          <button
            type="button"
            onClick={() => setShowReason(true)}
            disabled={loading !== null}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border-strong px-5 text-xs font-bold text-fg disabled:opacity-60"
          >
            <XCircle className="size-3.5" aria-hidden /> No, not yet
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <label htmlFor="detail-dispute" className="text-xs font-semibold text-fg">
            What happened?
          </label>
          <textarea
            id="detail-dispute"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-border bg-bg-elevated p-3 text-xs focus:border-brand focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowReason(false)}
              className="h-9 rounded-full border border-border px-4 text-xs font-semibold text-fg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={dispute}
              disabled={reason.trim().length < 5 || loading !== null}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-danger px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {loading === "no" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
              Send report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
