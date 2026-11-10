import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, products } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [productRows, categoryRows, brandRows] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    db
      .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories)
      .orderBy(asc(categories.position)),
    db.select({ id: brands.id, name: brands.name }).from(brands).orderBy(asc(brands.name)),
  ]);

  const product = productRows[0];
  if (!product) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted transition hover:text-brand"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> All products
        </Link>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          View on storefront <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>

      <h1 className="mt-3 text-xl font-black tracking-tight text-fg">{product.name}</h1>
      <p className="mt-1 text-xs text-fg-muted">
        {product.sku} · created {new Date(product.createdAt).toLocaleDateString("en-GB")}
      </p>

      <div className="mt-5">
        <ProductForm
          initial={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            shortDescription: product.shortDescription ?? "",
            description: product.description ?? "",
            categoryId: product.categoryId ?? "",
            brandId: product.brandId ?? "",
            price: product.price,
            compareAtPrice: product.compareAtPrice ?? "",
            costPrice: product.costPrice ?? "",
            stock: String(product.stock),
            lowStockThreshold: String(product.lowStockThreshold),
            status: product.status,
            isFeatured: product.isFeatured,
            isTrending: product.isTrending,
            isBestSeller: product.isBestSeller,
            isFlashSale: product.isFlashSale,
            warrantyMonths: String(product.warrantyMonths),
            metaTitle: product.metaTitle ?? "",
            metaDescription: product.metaDescription ?? "",
            images: product.images,
            specs: product.specs,
          }}
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
