import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, Receipt, User } from "lucide-react";
import { getOrderById } from "@/lib/orders";
import { OrderAdminControls } from "@/components/admin/order-admin-controls";
import { OrderProgressBar, OrderTimeline } from "@/components/store/order-progress";
import { ProductImage } from "@/components/ui/product-image";
import { StatusPill } from "@/components/ui/badge";
import {
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
} from "@/lib/constants";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getOrderById(id);
  if (!data) notFound();

  const { order, items, events, plan } = data;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-fg">{order.orderNumber}</h1>
          <p className="mt-0.5 text-[11px] text-fg-subtle">
            Placed {formatDateTime(order.placedAt)} · Tracking {order.trackingCode}
            {plan ? ` · ${plan.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill className={STATUS_TONES[order.status]}>
            {STATUS_LABELS[order.status]}
          </StatusPill>
          <StatusPill className="bg-bg-muted text-fg-muted ring-border">
            {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </StatusPill>
          <StatusPill className="bg-bg-muted text-fg-muted ring-border">
            {order.progress}%
          </StatusPill>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="text-sm font-bold text-fg">Lifecycle</h2>
            <div className="mt-3">
              <OrderProgressBar status={order.status} progress={order.progress} />
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <Package className="size-4 text-brand" aria-hidden /> Items ({items.length})
            </h2>
            <ul className="mt-3 divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-bg-muted">
                    <ProductImage src={item.imageUrl} alt={item.productName} sizes="44px" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-fg">{item.productName}</p>
                    <p className="text-[10px] text-fg-subtle">
                      {item.sku} · Qty {item.quantity} × {formatMoney(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-fg">{formatMoney(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="text-sm font-bold text-fg">Timeline</h2>
            <div className="mt-3">
              <OrderTimeline events={events} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <OrderAdminControls
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.paymentStatus}
          />

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <User className="size-4 text-brand" aria-hidden /> Customer
            </h2>
            <p className="mt-2 text-xs font-semibold text-fg">{order.email}</p>
            <p className="text-xs text-fg-muted">{order.phone}</p>
            <p className="mt-1 text-[10px] text-fg-subtle">
              {order.userId ? "Registered account" : "Guest checkout"}
            </p>
            {order.notes ? (
              <p className="mt-3 rounded-lg bg-bg-muted p-2.5 text-[11px] text-fg-muted">
                <span className="font-semibold text-fg">Note: </span>
                {order.notes}
              </p>
            ) : null}
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <MapPin className="size-4 text-brand" aria-hidden /> Ship to
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
              {order.shippingAddress.phone ?? order.phone}
            </address>
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <Receipt className="size-4 text-brand" aria-hidden /> Totals
            </h2>
            <dl className="mt-2 space-y-1 text-xs">
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
                <dd>{formatMoney(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between text-fg-muted">
                <dt>Tax</dt>
                <dd>{formatMoney(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-fg">
                <dt>Total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
