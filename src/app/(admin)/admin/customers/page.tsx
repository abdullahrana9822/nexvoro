import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { RoleControl } from "@/components/admin/role-control";
import { StatCard } from "@/components/admin/stat-card";
import { formatDate, formatMoney, initials } from "@/lib/utils";
import { getCurrentUser, hasRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const viewer = await getCurrentUser();
  const canManageRoles = viewer ? hasRole(viewer.role, "SUPER_ADMIN") : false;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      orderCount: sql<number>`(
        select count(*)::int from ${orders} where ${orders.userId} = ${users.id}
      )`,
      spent: sql<string>`(
        select coalesce(sum(${orders.total}), 0) from ${orders}
        where ${orders.userId} = ${users.id} and ${orders.status} <> 'CANCELLED'
      )`,
    })
    .from(users)
    .where(
      q.trim()
        ? sql`${users.email} ilike ${`%${q.trim()}%`} or ${users.firstName} ilike ${`%${q.trim()}%`} or ${users.lastName} ilike ${`%${q.trim()}%`}`
        : undefined,
    )
    .orderBy(desc(users.createdAt))
    .limit(200);

  const customers = rows.filter((row) => row.role === "CUSTOMER");
  const staff = rows.filter((row) => row.role !== "CUSTOMER");
  const totalSpent = customers.reduce((sum, row) => sum + Number(row.spent), 0);
  const repeat = customers.filter((row) => row.orderCount > 1).length;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-fg">Customers</h1>
          <p className="mt-1 text-xs text-fg-muted">
            {customers.length} customers · {staff.length} staff accounts
          </p>
        </div>
        <form action="/admin/customers" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            className="h-9 w-56 rounded-full border border-border bg-bg-elevated px-3.5 text-xs text-fg focus:border-brand focus:outline-none"
          />
          <button type="submit" className="h-9 rounded-full bg-fg px-4 text-xs font-bold text-bg">
            Search
          </button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total customers" value={customers.length} />
        <StatCard
          label="Repeat buyers"
          value={repeat}
          hint={
            customers.length > 0
              ? `${Math.round((repeat / customers.length) * 100)}% of customers`
              : undefined
          }
        />
        <StatCard label="Lifetime revenue" value={formatMoney(totalSpent)} />
      </div>

      <div className="panel mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-xs">
            <thead className="border-b border-border bg-bg-muted/60">
              <tr className="text-[10px] uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5 font-bold">Customer</th>
                <th className="px-4 py-2.5 font-bold">Phone</th>
                <th className="px-4 py-2.5 font-bold">Orders</th>
                <th className="px-4 py-2.5 font-bold">Spent</th>
                <th className="px-4 py-2.5 font-bold">Joined</th>
                <th className="px-4 py-2.5 font-bold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-bg-muted/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[9px] font-black text-brand">
                        {initials(`${row.firstName} ${row.lastName}`)}
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-52 truncate font-semibold text-fg">
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="max-w-52 truncate text-[10px] text-fg-subtle">
                          {row.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">{row.phone ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/orders?q=${encodeURIComponent(row.email)}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      {row.orderCount}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-fg">
                    {formatMoney(row.spent)}
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <RoleControl
                      userId={row.id}
                      role={row.role}
                      isActive={row.isActive}
                      canManage={canManageRoles}
                      isSelf={viewer?.id === row.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
