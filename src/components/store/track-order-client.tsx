"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Package, Search } from "lucide-react";
import { OrderProgressBar, OrderTimeline } from "@/components/store/order-progress";
import { StatusPill } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/constants";
import type { OrderStatus } from "@/db/schema";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";

type TrackResponse = {
  order: {
    orderNumber: string;
    status: OrderStatus;
    statusLabel: string;
    progress: number;
    placedAt: string;
    expectedDeliveryAt: string | null;
    deliveredAt: string | null;
    trackingCode: string;
    paymentStatus: string;
    paymentMethod: string;
    total: string;
    currency: string;
    email: string;
    city: string;
    country: string;
  };
  items: { name: string; slug: string; quantity: number; lineTotal: string }[];
  events: {
    type: string;
    message: string;
    progress: number | null;
    createdAt: string;
  }[];
};

export function TrackOrderClient({ initialReference }: { initialReference: string }) {
  const [reference, setReference] = useState(initialReference);
  const [data, setData] = useState<TrackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = useCallback(async (value: string) => {
    const term = value.trim();
    if (term.length < 4) {
      setError("Enter at least 4 characters of your order number.");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/track?order=${encodeURIComponent(term)}`, {
        cache: "no-store",
      });
      const json = (await response.json().catch(() => ({}))) as TrackResponse & {
        error?: string;
      };
      if (!response.ok) {
        setData(null);
        setError(json.error ?? "We could not find that order.");
        return;
      }
      setData(json);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the initial lookup never sets state during the effect body.
    const timer = window.setTimeout(() => {
      if (initialReference.length >= 4) void lookup(initialReference);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialReference, lookup]);

  return (
    <div className="space-y-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void lookup(reference);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="track-reference" className="sr-only">
          Order number or tracking code
        </label>
        <input
          id="track-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value.toUpperCase())}
          placeholder="NX-2026-10041 or NXTRKXXXXXXXX"
          className="h-12 flex-1 rounded-full border border-border bg-bg-elevated px-5 text-sm font-semibold uppercase tracking-wide text-fg placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Search className="size-4" aria-hidden />
          )}
          Track order
        </button>
      </form>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs font-medium text-warning"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </div>
      ) : null}

      {data ? (
        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  Order
                </p>
                <p className="text-lg font-black text-fg">{data.order.orderNumber}</p>
                <p className="mt-0.5 text-[11px] text-fg-subtle">
                  Placed {formatDateTime(data.order.placedAt)} · {data.order.email} ·{" "}
                  {data.order.city}, {data.order.country}
                </p>
              </div>
              <StatusPill className={STATUS_TONES[data.order.status]}>
                {STATUS_LABELS[data.order.status]}
              </StatusPill>
            </div>

            <div className="mt-4">
              <OrderProgressBar
                status={data.order.status}
                progress={data.order.progress}
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-fg-subtle">Expected</dt>
                <dd className="mt-0.5 font-semibold text-fg">
                  {formatDate(data.order.expectedDeliveryAt)}
                </dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Payment</dt>
                <dd className="mt-0.5 font-semibold text-fg">
                  {data.order.paymentMethod.replace("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Total</dt>
                <dd className="mt-0.5 font-semibold text-fg">
                  {formatMoney(data.order.total)}
                </dd>
              </div>
              <div>
                <dt className="text-fg-subtle">Tracking code</dt>
                <dd className="mt-0.5 font-mono text-[11px] font-semibold text-fg">
                  {data.order.trackingCode}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
                <Package className="size-4 text-brand" aria-hidden /> Items
              </h2>
              <ul className="mt-3 space-y-2">
                {data.items.map((item) => (
                  <li key={`${item.slug}-${item.name}`} className="flex justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate text-fg-muted">
                      {item.quantity} × {item.name}
                    </span>
                    <span className="shrink-0 font-semibold text-fg">
                      {formatMoney(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel p-5">
              <h2 className="text-sm font-bold text-fg">Activity</h2>
              <div className="mt-3">
                <OrderTimeline
                  events={data.events.map((event, index) => ({
                    id: `${event.type}-${index}`,
                    type: event.type,
                    message: event.message,
                    progress: event.progress,
                    createdAt: new Date(event.createdAt),
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg-muted/60 p-4 text-xs text-fg-muted">
            Need to confirm receipt or report a problem?{" "}
            <Link href="/account/orders" className="font-semibold text-brand hover:underline">
              Open your dashboard
            </Link>{" "}
            — delivery is only marked complete when you confirm it.
          </div>
        </div>
      ) : null}
    </div>
  );
}
