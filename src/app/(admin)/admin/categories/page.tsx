import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      imageUrl: categories.imageUrl,
      parentId: categories.parentId,
      position: categories.position,
      isActive: categories.isActive,
      isFeatured: categories.isFeatured,
      productCount: sql<number>`(
        select count(*)::int from ${products}
        where ${products.categoryId} = ${categories.id} and ${products.status} = 'ACTIVE'
      )`,
    })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));

  const activeCount = rows.filter((row) => row.isActive).length;

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Categories</h1>
      <p className="mt-1 text-xs text-fg-muted">
        {rows.length} categories · {activeCount} active. Categories with products cannot be
        hard-deleted, only disabled.
      </p>
      <div className="mt-5">
        <CategoryManager categories={rows} />
      </div>
      <p className="mt-4 text-[10px] text-fg-subtle">
        Product counts are computed in the same query, so this page stays a single round trip.
      </p>
    </div>
  );
}
