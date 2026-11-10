import { CatalogueImport } from "@/components/admin/catalogue-import";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, products } from "@/db/schema";
import { ProductImage } from "@/components/ui/product-image";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;

  const conditions = [];
  if (q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(or(ilike(products.name, term), ilike(products.sku, term))!);
  }
  if (status === "draft") conditions.push(eq(products.status, "DRAFT"));
  if (status === "archived") conditions.push(eq(products.status, "ARCHIVED"));
  if (status === "low") conditions.push(sql`${products.stock} <= ${products.lowStockThreshold}`);
  if (!status) conditions.push(ne(products.status, "ARCHIVED"));

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      stock: products.stock,
      status: products.status,
      images: products.images,
      soldCount: products.soldCount,
      categoryName: categories.name,
      brandName: brands.name,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt))
    .limit(200);

  const filterLinks = [
    { id: "", label: "Live" },
    { id: "draft", label: "Drafts" },
    { id: "low", label: "Low stock" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div>
      <CatalogueImport/>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-fg">Products</h1>
          <p className="mt-1 text-xs text-fg-muted">{rows.length} products in this view</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/admin/products" className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <input
              name="q"
              defaultValue={q}
              placeholder="Name or SKU"
              className="h-9 w-48 rounded-full border border-border bg-bg-elevated pl-8 pr-3 text-xs text-fg focus:border-brand focus:outline-none"
            />
          </form>
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-bold text-brand-fg"
          >
            <Plus className="size-3.5" aria-hidden /> New product
          </Link>
        </div>
      </div>

      <div className="mb-4 flex gap-1.5">
        {filterLinks.map((item) => (
          <Link
            key={item.id}
            href={`/admin/products${item.id ? `?status=${item.id}` : ""}`}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              status === item.id
                ? "border-brand bg-brand text-brand-fg"
                : "border-border text-fg-muted hover:border-brand hover:text-brand"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-170 text-left text-xs">
            <thead className="border-b border-border bg-bg-muted/60">
              <tr className="text-[10px] uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5 font-bold">Product</th>
                <th className="px-4 py-2.5 font-bold">Category</th>
                <th className="px-4 py-2.5 font-bold">Price</th>
                <th className="px-4 py-2.5 font-bold">Stock</th>
                <th className="px-4 py-2.5 font-bold">Sold</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-fg-subtle">
                    No products match this view.
                  </td>
                </tr>
              ) : (
                rows.map((product) => (
                  <tr key={product.id} className="transition hover:bg-bg-muted/40">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-bg-muted">
                          <ProductImage src={product.images[0]} alt="" sizes="36px" />
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="block max-w-56 truncate font-semibold text-fg hover:text-brand"
                          >
                            {product.name}
                          </Link>
                          <p className="text-[10px] text-fg-subtle">
                            {product.sku} · {product.brandName ?? "No brand"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-fg-muted">
                      {product.categoryName ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-fg">
                      {formatMoney(product.price)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          product.stock === 0
                            ? "font-bold text-danger"
                            : product.stock <= 5
                              ? "font-bold text-warning"
                              : "text-fg-muted"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-fg-muted">{product.soldCount}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          product.status === "ACTIVE"
                            ? "bg-success/10 text-success"
                            : product.status === "DRAFT"
                              ? "bg-warning/10 text-warning"
                              : "bg-bg-muted text-fg-subtle"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <ProductRowActions id={product.id} slug={product.slug} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
