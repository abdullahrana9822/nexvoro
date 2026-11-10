import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, products } from "@/db/schema";
import { CATALOGUE_CANDIDATES } from "@/lib/catalogue-candidates";
/** Additive and idempotent: never overwrites inventory, prices or live products. */
export async function importCatalogueCandidates() {
  return db.transaction(async (tx) => {
    let imported = 0;
    for (const p of CATALOGUE_CANDIDATES) {
      const brandSlug = p.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await tx
        .insert(brands)
        .values({ slug: brandSlug, name: p.brand })
        .onConflictDoNothing();
      await tx
        .insert(categories)
        .values({
          slug: p.category,
          name: p.categoryName,
          imageUrl: p.image,
          isFeatured: true,
        })
        .onConflictDoNothing();
      const [brand] = await tx
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.slug, brandSlug));
      const [category] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, p.category));
      const rows = await tx
        .insert(products)
        .values({
          slug: p.slug,
          name: p.name,
          sku: p.sku,
          brandId: brand!.id,
          categoryId: category!.id,
          description: p.description,
          shortDescription: p.shortDescription,
          images: [p.image],
          specs: p.specs,
          price: "0.00",
          stock: 0,
          status: "DRAFT",
          warrantyMonths: 0,
        })
        .onConflictDoNothing()
        .returning({ id: products.id });
      imported += rows.length;
    }
    return {
      imported,
      skipped: CATALOGUE_CANDIDATES.length - imported,
      totalCandidates: CATALOGUE_CANDIDATES.length,
    };
  });
}
