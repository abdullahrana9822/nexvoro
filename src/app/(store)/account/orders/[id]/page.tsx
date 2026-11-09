import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Package, Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { OrderProgressBar, OrderTimeline } from "@/components/store/order-progress";
import { DeliveryDecisionPanel } from "@/components/store/delivery-decision-panel";
import { ProductImage } from "@/components/ui/product-image";
import { StatusPill } from "@/components/ui/badge";
import {
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const data = await getOrderById(id);
  if (!data) notFound();
  if (data.order.userId !== user.id) redirect("/account/orders");

  const { order, items, events, plan } = data;
  const awaitingDecision = ["AWAITING_CONFIRMATION", "OUT_FOR_DELIVERY"].includes(order.status);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted transition hover:text-brand"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> All orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-fg">{order.orderNumber}</h1>
            <p className="text-[11px] text-fg-subtle">
              Placed {formatDateTime(order.placedAt)} · Tracking {order.trackingCode}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill className={STATUS_TONES[order.status]}>
              {STATUS_LABELS[order.status]}
            </StatusPill>
            <StatusPill className="bg-bg-muted text-fg-muted ring-border">
              {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </StatusPill>
          </div>
        </div>
      </div>

      {awaitingDecision ? <DeliveryDecisionPanel orderId={order.id} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="text-sm font-bold text-fg">Progress</h2>
            <div className="mt-3">
              <OrderProgressBar status={order.status} progress={order.progress} />
            </div>
            <p className="mt-3 text-[11px] text-fg-subtle">
              Progress stops at 99% until you confirm delivery. Expected{" "}
              {formatDate(order.expectedDeliveryAt)}
              {plan ? ` · ${plan.name}` : ""}.
            </p>
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <Package className="size-4 text-brand" aria-hidden /> Items
            </h2>
            <ul className="mt-3 divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <Link
                    href={`/product/${item.productSlug}`}
                    className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-muted"
                  >
                    <ProductImage src={item.imageUrl} alt={item.productName} sizes="56px" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="block truncate text-xs font-semibold text-fg hover:text-brand"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-[10px] text-fg-subtle">
                      {item.sku} · Qty {item.quantity} · {formatMoney(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-fg">{formatMoney(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="text-sm font-bold text-fg">Activity</h2>
            <div className="mt-3">
              <OrderTimeline events={events} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <Receipt className="size-4 text-brand" aria-hidden /> Summary
            </h2>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-fg-muted">
                <dt>Subtotal</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
              {Number(order.discount) > 0 ? (
                <div className="flex justify-between text-success">
                  <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd>−{formatMoney(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-fg-muted">
                <dt>Delivery</dt>
                <dd>
                  {Number(order.shippingCost) === 0 ? "Free" : formatMoney(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-fg">
                <dt>Total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <MapPin className="size-4 text-brand" aria-hidden /> Delivery address
            </h2>
            <address className="mt-2 text-xs not-italic leading-relaxed text-fg-muted">
              <span className="block font-semibold text-fg">
                {order.shippingAddress.fullName}
              </span>
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
              <br />
              {order.phone}
            </address>
          </div>

          {order.notes ? (
            <div className="panel p-5">
              <h2 className="text-sm font-bold text-fg">Your notes</h2>
              <p className="mt-2 text-xs text-fg-muted">{order.notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
