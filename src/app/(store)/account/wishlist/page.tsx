import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { Heart } from "lucide-react";
import { db } from "@/db";
import {
  brands as brandsTable,
  categories as categoriesTable,
  products,
  wishlistItems,
} from "@/db/schema";
import { requirePageUser } from "@/lib/page-auth";
import { toCardProduct } from "@/lib/catalog";
import { ProductGrid } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
};

const brandName = sql<string | null>`(
  select name from ${brandsTable} where ${brandsTable.id} = ${products.brandId}
)`;
const categoryName = sql<string | null>`(
  select name from ${categoriesTable} where ${categoriesTable.id} = ${products.categoryId}
)`;

export default async function WishlistPage() {
  const user = await requirePageUser();

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      images: products.images,
      ratingAvg: products.ratingAvg,
      ratingCount: products.ratingCount,
      stock: products.stock,
      isFlashSale: products.isFlashSale,
      flashSaleEndsAt: products.flashSaleEndsAt,
      shortDescription: products.shortDescription,
      brandName,
      categoryName,
    })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .where(eq(wishlistItems.userId, user.id))
    .orderBy(desc(wishlistItems.createdAt));

  return (
    <div>
      <h1 className="text-lg font-bold text-fg">Wishlist</h1>
      <p className="mt-1 text-sm text-fg-muted">
        {rows.length} saved item{rows.length === 1 ? "" : "s"} — prices update automatically.
      </p>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Heart className="size-6" aria-hidden />}
            title="Nothing saved yet"
            description="Tap the heart on any product to keep it here for later."
            action={{ label: "Browse products", href: "/shop" }}
          />
        ) : (
          <ProductGrid
            products={rows.map((row) => toCardProduct(row))}
            savedIds={rows.map((row) => row.id)}
          />
        )}
      </div>
    </div>
  );
}
