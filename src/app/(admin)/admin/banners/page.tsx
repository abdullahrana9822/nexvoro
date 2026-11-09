import { asc } from "drizzle-orm";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { BannerManager } from "@/components/admin/banner-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const rows = await db
    .select()
    .from(banners)
    .orderBy(asc(banners.slot), asc(banners.position))
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Banners</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Promotional strips for the homepage, announcement bar and category pages. Only active
        banners inside their date window are rendered; expired promos disappear automatically.
      </p>
      <div className="mt-5">
        <BannerManager banners={rows} />
      </div>
    </div>
  );
}
