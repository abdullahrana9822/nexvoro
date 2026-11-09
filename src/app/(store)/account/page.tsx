import type { Metadata } from "next";
import Link from "next/link";
import { Package, Receipt, TrendingUp, Truck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCustomerStats, getOrdersForUser } from "@/lib/orders";
import { countPendingConfirmations } from "@/lib/delivery";
import { OrderProgressBar } from "@/components/store/order-progress";
import { StatusPill } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const user = await requireUser();
  const [stats, orders, pending] = await Promise.all([
    getCustomerStats(user.id),
    getOrdersForUser(user.id),
    countPendingConfirmations(user.id),
  ]);

  const recent = orders.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total orders", value: String(stats.orders), Icon: Package },
          { label: "Lifetime spend", value: formatMoney(stats.spent), Icon: Receipt },
          { label: "Active orders", value: String(stats.open), Icon: Truck },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="panel p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                {label}
              </p>
              <Icon className="size-4 text-brand" aria-hidden />
            </div>
            <p className="mt-2 text-xl font-black text-fg">{value}</p>
          </div>
        ))}
      </div>

      {pending > 0 ? (
        <div className="rounded-2xl border border-brand/30 bg-brand-soft p-4">
          <p className="text-sm font-bold text-brand">
            {pending} order{pending === 1 ? "" : "s"} awaiting your delivery confirmation
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            Confirm receipt so we can close the order — or tell us it has not arrived.
          </p>
          <Link
            href="/account/orders"
            className="mt-3 inline-flex h-9 items-center rounded-full bg-brand px-4 text-xs font-bold text-brand-fg"
          >
            Review orders
          </Link>
        </div>
      ) : null}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-fg">Recent orders</h2>
          <Link href="/account/orders" className="text-xs font-semibold text-brand hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="panel mt-3 p-8 text-center">
            <TrendingUp className="mx-auto size-6 text-fg-subtle" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-fg">No orders yet</p>
            <p className="mt-1 text-xs text-fg-muted">
              Once you order, live tracking and delivery confirmation appear here.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-flex h-10 items-center rounded-full bg-brand px-5 text-xs font-bold text-brand-fg"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {recent.map((order) => (
              <li key={order.id} className="panel p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm font-bold text-fg hover:text-brand"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-[11px] text-fg-subtle">
                      Placed {formatDate(order.placedAt)} · {formatMoney(order.total)}
                    </p>
                  </div>
                  <StatusPill className={STATUS_TONES[order.status]}>
                    {STATUS_LABELS[order.status]}
                  </StatusPill>
                </div>
                <div className="mt-3">
                  <OrderProgressBar status={order.status} progress={order.progress} compact />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
