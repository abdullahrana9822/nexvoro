import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, reviews } from "@/db/schema";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.mustChangePassword) redirect("/change-password");
  if (!hasRole(user.role, "STAFF")) redirect("/account");

  const [pendingOrders, pendingReviews, disputed] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(orders)
      .where(inArray(orders.status, ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"])),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.status, "PENDING")),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.status, "DISPUTED"))),
  ]);

  return (
    <AdminShell
      user={user}
      counts={{
        ordersPending: pendingOrders[0]?.total ?? 0,
        pendingReviews: pendingReviews[0]?.total ?? 0,
        disputed: disputed[0]?.total ?? 0,
      }}
    >
      {children}
    </AdminShell>
  );
}
