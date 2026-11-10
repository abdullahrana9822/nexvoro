import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { AlertTriangle, Bell, Package, Star, UserPlus } from "lucide-react";
import { db } from "@/db";
import { contactMessages, notifications, orders, reviews, users } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ICONS = {
  DISPUTE: AlertTriangle,
  ORDER: Package,
  REVIEW: Star,
  SECURITY: AlertTriangle,
  PAYMENT: Package,
  SYSTEM: Bell,
} as const;

export default async function AdminNotificationsPage() {
  const [rows, disputes, pendingReviews, newCustomers, unreadMessages] = await Promise.all([
    db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50),
    db
      .select({ id: orders.id, orderNumber: orders.orderNumber, email: orders.email, updatedAt: orders.updatedAt })
      .from(orders)
      .where(eq(orders.status, "DISPUTED"))
      .orderBy(desc(orders.updatedAt))
      .limit(20),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.status, "PENDING")),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.createdAt} > now() - interval '7 days'`),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(eq(contactMessages.isRead, false)),
  ]);

  const alerts = [
    {
      Icon: AlertTriangle,
      tone: "danger" as const,
      title: "Delivery disputes",
      value: disputes.length,
      href: "/admin/orders?status=disputed",
      detail: "Customers reported a parcel did not arrive",
    },
    {
      Icon: Star,
      tone: "warning" as const,
      title: "Reviews awaiting moderation",
      value: pendingReviews[0]?.total ?? 0,
      href: "/admin/reviews",
      detail: "Not visible on the storefront until approved",
    },
    {
      Icon: UserPlus,
      tone: "brand" as const,
      title: "New customers (7 days)",
      value: newCustomers[0]?.total ?? 0,
      href: "/admin/customers",
      detail: "Accounts created this week",
    },
    {
      Icon: Bell,
      tone: "info" as const,
      title: "Unread messages",
      value: unreadMessages[0]?.total ?? 0,
      href: "/admin/messages",
      detail: "Contact form submissions",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Notifications</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Operational alerts that need a human. Order updates are delivered to customers
        automatically.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {alerts.map((alert) => (
          <Link
            key={alert.title}
            href={alert.href}
            className="panel p-4 transition hover:border-brand"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                {alert.title}
              </p>
              <alert.Icon className="size-3.5 text-fg-subtle" aria-hidden />
            </div>
            <p
              className={`mt-1.5 text-xl font-black ${
                alert.value > 0 ? "text-fg" : "text-fg-subtle"
              }`}
            >
              {alert.value}
            </p>
            <p className="mt-0.5 text-[10px] text-fg-muted">{alert.detail}</p>
          </Link>
        ))}
      </div>

      {disputes.length > 0 ? (
        <div className="panel mt-4 border-danger/30 p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-danger">
            <AlertTriangle className="size-4" aria-hidden /> Disputed deliveries
          </h2>
          <ul className="mt-3 space-y-2">
            {disputes.map((dispute) => (
              <li key={dispute.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-fg-muted">
                  <Link
                    href={`/admin/orders/${dispute.id}`}
                    className="font-bold text-fg hover:text-brand"
                  >
                    {dispute.orderNumber}
                  </Link>{" "}
                  · {dispute.email}
                </span>
                <span className="text-[10px] text-fg-subtle">
                  raised {formatDateTime(dispute.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="panel mt-4 p-5">
        <h2 className="text-sm font-bold text-fg">Recent system notifications</h2>
        <ul className="mt-3 space-y-2.5">
          {rows.length === 0 ? (
            <li className="text-[11px] text-fg-subtle">Nothing yet.</li>
          ) : (
            rows.map((row) => {
              const Icon = ICONS[row.type] ?? Bell;
              return (
                <li key={row.id} className="flex gap-2.5">
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-fg">{row.title}</p>
                    {row.body ? (
                      <p className="truncate text-[10px] text-fg-muted">{row.body}</p>
                    ) : null}
                    <p className="text-[9px] text-fg-subtle">{formatDateTime(row.createdAt)}</p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
