import Link from "next/link";
import { Search } from "lucide-react";
import { and, desc, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { StatusPill } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/constants";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

const TABS: { id: string; label: string; statuses?: OrderStatus[] }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active", statuses: ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"] },
  { id: "awaiting", label: "Awaiting confirm", statuses: ["AWAITING_CONFIRMATION"] },
  { id: "delivered", label: "Delivered", statuses: ["DELIVERED"] },
  { id: "disputed", label: "Disputed", statuses: ["DISPUTED"] },
  { id: "cancelled", label: "Cancelled", statuses: ["CANCELLED", "RETURNED"] },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = "all", q = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const perPage = 20;

  const tab = TABS.find((item) => item.id === status) ?? TABS[0];
  const conditions = [];

  if (tab?.statuses) conditions.push(inArray(orders.status, tab.statuses));
  if (q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(or(ilike(orders.orderNumber, term), ilike(orders.email, term))!);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(perPage)
      .offset((currentPage - 1) * perPage),
    db.select({ total: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);

  const total = countRows[0]?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-fg">Orders</h1>
          <p className="mt-1 text-xs text-fg-muted">
            {total} order{total === 1 ? "" : "s"} · automated lifecycle with manual override
          </p>
        </div>

        <form action="/admin/orders" className="flex items-center gap-2">
          <input type="hidden" name="status" value={status} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <input
              name="q"
              defaultValue={q}
              placeholder="Order number or email"
              className="h-9 w-56 rounded-full border border-border bg-bg-elevated pl-8 pr-3 text-xs text-fg focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-full bg-fg px-4 text-xs font-bold text-bg"
          >
            Search
          </button>
        </form>
      </div>

      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/admin/orders?status=${item.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
              item.id === status
                ? "border-brand bg-brand text-brand-fg"
                : "border-border text-fg-muted hover:border-brand hover:text-brand",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-xs">
            <thead className="border-b border-border bg-bg-muted/60">
              <tr className="text-[10px] uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5 font-bold">Order</th>
                <th className="px-4 py-2.5 font-bold">Customer</th>
                <th className="px-4 py-2.5 font-bold">Placed</th>
                <th className="px-4 py-2.5 font-bold">Total</th>
                <th className="px-4 py-2.5 font-bold">Payment</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-fg-subtle">
                    No orders match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((order) => (
                  <tr key={order.id} className="transition hover:bg-bg-muted/40">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-bold text-fg hover:text-brand"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="max-w-40 truncate text-fg-muted">{order.email}</p>
                      <p className="text-[10px] text-fg-subtle">{order.phone}</p>
                    </td>
                    <td className="px-4 py-2.5 text-fg-muted">
                      {formatDateTime(order.placedAt)}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-fg">
                      {formatMoney(order.total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-fg-muted">
                        {order.paymentMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill className={STATUS_TONES[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              order.progress === 100 ? "bg-success" : "bg-brand",
                            )}
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] tabular-nums text-fg-subtle">
                          {order.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="mt-4 flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => (
            <Link
              key={item}
              href={`/admin/orders?status=${status}&page=${item}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "grid size-8 place-items-center rounded-full border text-xs font-semibold",
                item === currentPage
                  ? "border-brand bg-brand text-brand-fg"
                  : "border-border text-fg-muted hover:border-brand",
              )}
            >
              {item}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

