import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { getOrdersForUser } from "@/lib/orders";
import { OrderProgressBar } from "@/components/store/order-progress";
import { StatusPill } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/card";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order history",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const user = await requirePageUser();
  const orders = await getOrdersForUser(user.id);

  return (
    <div>
      <h1 className="text-lg font-bold text-fg">Order history</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Every order, its live progress and the option to confirm delivery.
      </p>

      {orders.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Package className="size-6" aria-hidden />}
            title="No orders yet"
            description="When you place an order it will appear here with live tracking."
            action={{ label: "Browse products", href: "/shop" }}
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm font-bold text-fg hover:text-brand"
                    >
                      {order.orderNumber}
                    </Link>
                    <StatusPill className={STATUS_TONES[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    Placed {formatDate(order.placedAt)} · Expected{" "}
                    {formatDate(order.expectedDeliveryAt)} · {order.paymentMethod.replace("_", " ")}
                  </p>
                </div>
                <p className="text-base font-extrabold text-fg">{formatMoney(order.total)}</p>
              </div>

              <div className="mt-3">
                <OrderProgressBar status={order.status} progress={order.progress} compact />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="inline-flex h-9 items-center rounded-full border border-border px-4 text-xs font-semibold text-fg transition hover:border-brand hover:text-brand"
                >
                  View details
                </Link>
                <Link
                  href={`/track?order=${order.orderNumber}`}
                  className="inline-flex h-9 items-center rounded-full border border-border px-4 text-xs font-semibold text-fg transition hover:border-brand hover:text-brand"
                >
                  Track
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
