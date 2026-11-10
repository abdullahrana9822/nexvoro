import { asc } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { RoleControl } from "@/components/admin/role-control";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PERMISSIONS: { role: string; abilities: string[] }[] = [
  {
    role: "CUSTOMER",
    abilities: ["Shop, manage own orders", "Track deliveries", "Write verified reviews"],
  },
  {
    role: "STAFF",
    abilities: ["View the admin panel", "Read orders and customers", "Moderate reviews"],
  },
  {
    role: "ADMIN",
    abilities: [
      "Create and edit products",
      "Change order status (including Delivered)",
      "Manage categories, coupons, shipping",
      "Edit storefront settings",
    ],
  },
  {
    role: "SUPER_ADMIN",
    abilities: [
      "Everything an admin can do",
      "Change user roles and deactivate accounts",
      "Run database diagnostics and exports",
    ],
  },
];

export default async function RolesPage() {
  const viewer = await getCurrentUser();
  const canManage = viewer ? hasRole(viewer.role, "SUPER_ADMIN") : false;

  const staff = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(asc(users.role))
    .limit(200);

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Roles & permissions</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Authorisation is enforced server-side on every request — hiding a button is never the only
        protection.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PERMISSIONS.map((entry) => (
          <div key={entry.role} className="panel p-4">
            <p className="flex items-center gap-1.5 text-xs font-black text-fg">
              <ShieldCheck className="size-3.5 text-brand" aria-hidden />
              {entry.role.replace("_", " ")}
            </p>
            <ul className="mt-2 space-y-1">
              {entry.abilities.map((ability) => (
                <li key={ability} className="flex gap-1.5 text-[10px] leading-relaxed text-fg-muted">
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                  {ability}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="panel mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-xs">
            <thead className="border-b border-border bg-bg-muted/60">
              <tr className="text-[10px] uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5 font-bold">User</th>
                <th className="px-4 py-2.5 font-bold">Joined</th>
                <th className="px-4 py-2.5 font-bold">Last login</th>
                <th className="px-4 py-2.5 font-bold">Role / status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[9px] font-black text-brand">
                        {initials(`${row.firstName} ${row.lastName}`)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">
                          {row.firstName} {row.lastName}
                        </p>
                        <p className="max-w-52 truncate text-[10px] text-fg-subtle">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-fg-muted">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-2.5 text-fg-muted">
                    {row.lastLoginAt ? formatDate(row.lastLoginAt) : "Never"}
                  </td>
                  <td className="px-4 py-2.5">
                    <RoleControl
                      userId={row.id}
                      role={row.role}
                      isActive={row.isActive}
                      canManage={canManage}
                      isSelf={viewer?.id === row.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!canManage ? (
        <p className="mt-3 text-[10px] text-fg-subtle">
          Only SUPER_ADMIN accounts can change roles. You can view this page as an admin.
        </p>
      ) : null}
    </div>
  );
}
