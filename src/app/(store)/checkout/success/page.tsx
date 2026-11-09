import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { getOrderByNumberForTracking } from "@/lib/orders";
import { formatDate, formatMoney } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const data = orderNumber ? await getOrderByNumberForTracking(orderNumber) : null;

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-black tracking-tight text-fg sm:text-3xl">
          Thank you — your order is in
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          We have emailed a confirmation and started preparing your items. You can follow every
          step from the tracking page.
        </p>
      </div>

      {data ? (
        <div className="panel mx-auto mt-8 max-w-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                Order number
              </p>
              <p className="text-lg font-black text-fg">{data.order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                Status
              </p>
              <p className="text-sm font-bold text-brand">{STATUS_LABELS[data.order.status]}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {data.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-fg">{item.productName}</span>
                  <span className="text-[11px] text-fg-subtle">Qty {item.quantity}</span>
                </span>
                <span className="font-bold text-fg">{formatMoney(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-fg-muted">
              <dt>Subtotal</dt>
              <dd>{formatMoney(data.order.subtotal)}</dd>
            </div>
            {Number(data.order.discount) > 0 ? (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd>−{formatMoney(data.order.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-fg-muted">
              <dt>Delivery</dt>
              <dd>
                {Number(data.order.shippingCost) === 0
                  ? "Free"
                  : formatMoney(data.order.shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-fg">
              <dt>Total</dt>
              <dd>{formatMoney(data.order.total)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-4 rounded-xl bg-bg-muted p-4 text-xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <Truck className="size-3.5 text-brand" aria-hidden />
              Expected by {formatDate(data.order.expectedDeliveryAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="size-3.5 text-brand" aria-hidden />
              Tracking {data.order.trackingCode}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-3">
        <Link
          href={orderNumber ? `/track?order=${orderNumber}` : "/track"}
          className="inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-brand-fg"
        >
          Track this order
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-fg"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
