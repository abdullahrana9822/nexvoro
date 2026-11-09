import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import {
  assertSameOrigin,
  handleError,
  readJson,
  withRole,
} from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk, slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().max(160).optional(),
  sku: z.string().trim().min(2).max(60),
  shortDescription: z.string().trim().max(400).optional().or(z.literal("")),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  brandId: z.string().uuid().optional().or(z.literal("")),
  price: z.coerce.number().nonnegative().max(100_000_000),
  compareAtPrice: z.coerce.number().nonnegative().max(100_000_000).optional(),
  costPrice: z.coerce.number().nonnegative().max(100_000_000).optional(),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(10_000).optional(),
  images: z.array(z.string().trim().max(500)).max(8).optional(),
  specs: z
    .array(z.object({ label: z.string().max(80), value: z.string().max(200) }))
    .max(30)
    .optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isFlashSale: z.boolean().optional(),
  warrantyMonths: z.coerce.number().int().min(0).max(120).optional(),
  metaTitle: z.string().trim().max(160).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(320).optional().or(z.literal("")),
});

const updateSchema = productSchema.partial().extend({ id: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = productSchema.parse(await readJson(request));
      const slug = slugify(payload.slug || payload.name);

      const existing = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);
      if (existing.length > 0) {
        return jsonError("A product with that slug already exists", 409);
      }

      const inserted = await db
        .insert(products)
        .values({
          name: payload.name,
          slug,
          sku: payload.sku,
          shortDescription: payload.shortDescription || null,
          description: payload.description || null,
          categoryId: payload.categoryId || null,
          brandId: payload.brandId || null,
          price: payload.price.toFixed(2),
          compareAtPrice:
            payload.compareAtPrice !== undefined && payload.compareAtPrice > 0
              ? payload.compareAtPrice.toFixed(2)
              : null,
          costPrice:
            payload.costPrice !== undefined && payload.costPrice > 0
              ? payload.costPrice.toFixed(2)
              : null,
          stock: payload.stock,
          lowStockThreshold: payload.lowStockThreshold ?? 5,
          images: payload.images ?? [],
          specs: payload.specs ?? [],
          status: payload.status ?? "DRAFT",
          isFeatured: payload.isFeatured ?? false,
          isTrending: payload.isTrending ?? false,
          isBestSeller: payload.isBestSeller ?? false,
          isFlashSale: payload.isFlashSale ?? false,
          warrantyMonths: payload.warrantyMonths ?? 12,
          metaTitle: payload.metaTitle || null,
          metaDescription: payload.metaDescription || null,
        })
        .returning();

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "product.created",
        entity: "product",
        entityId: inserted[0]?.id,
        meta: { name: payload.name, price: payload.price },
      });

      return jsonOk({ product: inserted[0] }, 201);
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = updateSchema.parse(await readJson(request));
      const { id, ...rest } = payload;

      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (rest.name !== undefined) update.name = rest.name;
      if (rest.slug !== undefined) update.slug = slugify(rest.slug);
      if (rest.sku !== undefined) update.sku = rest.sku;
      if (rest.shortDescription !== undefined)
        update.shortDescription = rest.shortDescription || null;
      if (rest.description !== undefined) update.description = rest.description || null;
      if (rest.categoryId !== undefined) update.categoryId = rest.categoryId || null;
      if (rest.brandId !== undefined) update.brandId = rest.brandId || null;
      if (rest.price !== undefined) update.price = rest.price.toFixed(2);
      if (rest.compareAtPrice !== undefined)
        update.compareAtPrice = rest.compareAtPrice > 0 ? rest.compareAtPrice.toFixed(2) : null;
      if (rest.costPrice !== undefined)
        update.costPrice = rest.costPrice > 0 ? rest.costPrice.toFixed(2) : null;
      if (rest.stock !== undefined) update.stock = rest.stock;
      if (rest.lowStockThreshold !== undefined)
        update.lowStockThreshold = rest.lowStockThreshold;
      if (rest.images !== undefined) update.images = rest.images;
      if (rest.specs !== undefined) update.specs = rest.specs;
      if (rest.status !== undefined) update.status = rest.status;
      if (rest.isFeatured !== undefined) update.isFeatured = rest.isFeatured;
      if (rest.isTrending !== undefined) update.isTrending = rest.isTrending;
      if (rest.isBestSeller !== undefined) update.isBestSeller = rest.isBestSeller;
      if (rest.isFlashSale !== undefined) update.isFlashSale = rest.isFlashSale;
      if (rest.warrantyMonths !== undefined) update.warrantyMonths = rest.warrantyMonths;
      if (rest.metaTitle !== undefined) update.metaTitle = rest.metaTitle || null;
      if (rest.metaDescription !== undefined)
        update.metaDescription = rest.metaDescription || null;

      const updated = await db
        .update(products)
        .set(update)
        .where(eq(products.id, id))
        .returning();

      if (!updated[0]) return jsonError("Product not found", 404);

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "product.updated",
        entity: "product",
        entityId: id,
        meta: { fields: Object.keys(update) },
      });

      return jsonOk({ product: updated[0] });
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      if (!id) return jsonError("Product id is required", 422);

      // Archive instead of hard-delete so historical order lines stay intact.
      const updated = await db
        .update(products)
        .set({ status: "ARCHIVED", updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning({ id: products.id });

      if (!updated[0]) return jsonError("Product not found", 404);

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "product.archived",
        entity: "product",
        entityId: id,
      });

      return jsonOk({ archived: true });
    });
  } catch (error) {
    return handleError(error);
  }
}
