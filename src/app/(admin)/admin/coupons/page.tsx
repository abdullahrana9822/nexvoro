import { desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { CouponManager } from "@/components/admin/coupon-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt)).limit(100);

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Coupons</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Discounts are validated server-side at checkout, including usage caps and per-customer
        limits.
      </p>
      <div className="mt-5">
        <CouponManager
          coupons={rows.map((row) => ({
            id: row.id,
            code: row.code,
            description: row.description,
            type: row.type,
            value: row.value,
            minSubtotal: row.minSubtotal,
            maxDiscount: row.maxDiscount,
            maxUses: row.maxUses,
            usedCount: row.usedCount,
            isActive: row.isActive,
            expiresAt: row.expiresAt,
          }))}
        />
      </div>
    </div>
  );
}
