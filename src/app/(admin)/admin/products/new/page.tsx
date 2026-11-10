import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories } from "@/db/schema";
import { ProductForm, EMPTY_PRODUCT } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categoryRows, brandRows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.position)),
    db
      .select({ id: brands.id, name: brands.name })
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(asc(brands.name)),
  ]);

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> All products
      </Link>
      <h1 className="mt-3 text-xl font-black tracking-tight text-fg">New product</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Publish as a draft first if you are still waiting on photography or pricing.
      </p>

      <div className="mt-5">
        <ProductForm
          initial={EMPTY_PRODUCT}
          categories={categoryRows.map((row) => ({
            id: row.id,
            name: row.parentId ? `— ${row.name}` : row.name,
          }))}
          brands={brandRows}
        />
      </div>
    </div>
  );
}
