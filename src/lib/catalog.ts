import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  brands,
  categories,
  productVariants,
  products,
  reviews,
  type Product,
} from "@/db/schema";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";

export type CatalogFilters = {
  ids?: string[];
  q?: string;
  category?: string;
  brand?: string;
  min?: number;
  max?: number;
  rating?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "top-rated" | "best-selling";
  deals?: boolean;
  inStock?: boolean;
  page?: number;
};

export type CatalogProduct = Product & {
  categoryName: string | null;
  categorySlug: string | null;
  brandName: string | null;
  brandSlug: string | null;
};

const PUBLIC_PRODUCT_FIELDS = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  sku: products.sku,
  shortDescription: products.shortDescription,
  description: products.description,
  categoryId: products.categoryId,
  brandId: products.brandId,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  costPrice: products.costPrice,
  currency: products.currency,
  stock: products.stock,
  lowStockThreshold: products.lowStockThreshold,
  images: products.images,
  specs: products.specs,
  tags: products.tags,
  status: products.status,
  isFeatured: products.isFeatured,
  isTrending: products.isTrending,
  isBestSeller: products.isBestSeller,
  isFlashSale: products.isFlashSale,
  flashSaleEndsAt: products.flashSaleEndsAt,
  ratingAvg: products.ratingAvg,
  ratingCount: products.ratingCount,
  soldCount: products.soldCount,
  viewCount: products.viewCount,
  warrantyMonths: products.warrantyMonths,
  metaTitle: products.metaTitle,
  metaDescription: products.metaDescription,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
  categoryName: categories.name,
  categorySlug: categories.slug,
  brandName: brands.name,
  brandSlug: brands.slug,
};

function baseQuery() {
  return db
    .select(PUBLIC_PRODUCT_FIELDS)
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(brands, eq(brands.id, products.brandId));
}

function orderBy(sort: CatalogFilters["sort"]) {
  switch (sort) {
    case "price-asc":
      return asc(products.price);
    case "price-desc":
      return desc(products.price);
    case "top-rated":
      return desc(products.ratingAvg);
    case "best-selling":
      return desc(products.soldCount);
    default:
      return desc(products.createdAt);
  }
}

export async function listProducts(filters: CatalogFilters): Promise<{
  items: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const conditions = [eq(products.status, "ACTIVE" as const)];

  if (filters.ids) conditions.push(inArray(products.id, filters.ids));

  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(products.name, term),
        ilike(products.shortDescription, term),
        ilike(products.sku, term),
        ilike(categories.name, term),
        ilike(brands.name, term),
      )!,
    );
  }
  if (filters.category) {
    // Match the category or any of its children (one level deep).
    const ids = await categoryAndChildIds(filters.category);
    if (ids.length === 0) {
      return { items: [], total: 0, page: 1, pageCount: 0 };
    }
    conditions.push(inArray(products.categoryId, ids));
  }
  if (filters.brand) conditions.push(eq(brands.slug, filters.brand));
  if (typeof filters.min === "number") conditions.push(gte(products.price, String(filters.min)));
  if (typeof filters.max === "number") conditions.push(lte(products.price, String(filters.max)));
  if (filters.rating && filters.rating > 0) {
    conditions.push(gte(products.ratingAvg, String(filters.rating)));
  }
  if (filters.deals) {
    conditions.push(
      or(
        eq(products.isFlashSale, true),
        sql`${products.compareAtPrice} > ${products.price}`,
      )!,
    );
  }
  if (filters.inStock) conditions.push(gte(products.stock, 1));

  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(orderBy(filters.sort))
      .limit(PRODUCTS_PER_PAGE)
      .offset((page - 1) * PRODUCTS_PER_PAGE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
  };
}

export async function categoryAndChildIds(slug: string): Promise<string[]> {
  const parent = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  const parentRow = parent[0];
  if (!parentRow) return [];

  const children = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.parentId, parentRow.id));

  return [parentRow.id, ...children.map((c) => c.id)];
}

export async function getProductBySlug(slug: string) {
  const rows = await baseQuery()
    .where(and(eq(products.slug, slug), ne(products.status, "ARCHIVED")))
    .limit(1);
  const product = rows[0];
  if (!product) return null;

  const [variants, productReviews] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)))
      .orderBy(asc(productVariants.name)),
    db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, product.id), eq(reviews.status, "APPROVED")))
      .orderBy(desc(reviews.createdAt))
      .limit(20),
  ]);

  return { product, variants, reviews: productReviews };
}

export async function getRelatedProducts(
  product: { id: string; categoryId: string | null },
  limit = 4,
): Promise<CatalogProduct[]> {
  if (!product.categoryId) {
    return db
      .select(PUBLIC_PRODUCT_FIELDS)
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .where(eq(products.status, "ACTIVE"))
      .orderBy(desc(products.soldCount))
      .limit(limit);
  }
  return db
    .select(PUBLIC_PRODUCT_FIELDS)
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .where(
      and(
        eq(products.status, "ACTIVE"),
        eq(products.categoryId, product.categoryId),
        ne(products.id, product.id),
      ),
    )
    .orderBy(desc(products.ratingAvg))
    .limit(limit);
}

export type CollectionKey =
  | "featured"
  | "trending"
  | "best-sellers"
  | "flash-sale"
  | "new-arrivals";

export async function getCollection(
  key: CollectionKey,
  limit = 8,
): Promise<CatalogProduct[]> {
  const base = () =>
    db
      .select(PUBLIC_PRODUCT_FIELDS)
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(brands, eq(brands.id, products.brandId));

  switch (key) {
    case "featured":
      return base()
        .where(and(eq(products.status, "ACTIVE"), eq(products.isFeatured, true)))
        .orderBy(desc(products.ratingAvg))
        .limit(limit);
    case "trending":
      return base()
        .where(and(eq(products.status, "ACTIVE"), eq(products.isTrending, true)))
        .orderBy(desc(products.viewCount))
        .limit(limit);
    case "best-sellers":
      return base()
        .where(and(eq(products.status, "ACTIVE"), eq(products.isBestSeller, true)))
        .orderBy(desc(products.soldCount))
        .limit(limit);
    case "flash-sale":
      return base()
        .where(and(eq(products.status, "ACTIVE"), eq(products.isFlashSale, true)))
        .orderBy(asc(products.flashSaleEndsAt))
        .limit(limit);
    default:
      return base()
        .where(eq(products.status, "ACTIVE"))
        .orderBy(desc(products.createdAt))
        .limit(limit);
  }
}

export async function getCategoryTree() {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      imageUrl: categories.imageUrl,
      icon: categories.icon,
      parentId: categories.parentId,
      isFeatured: categories.isFeatured,
      position: categories.position,
      description: categories.description,
      productCount: sql<number>`(
        select count(*)::int from ${products}
        where ${products.categoryId} = ${categories.id}
          and ${products.status} = 'ACTIVE'
      )`,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.position), asc(categories.name));

  const roots = rows.filter((row) => !row.parentId);
  return roots.map((root) => ({
    ...root,
    children: rows.filter((row) => row.parentId === root.id),
  }));
}

export type CategoryNode = Awaited<ReturnType<typeof getCategoryTree>>[number];

export async function getCategoryBySlug(slug: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getBrands() {
  return db
    .select()
    .from(brands)
    .where(eq(brands.isActive, true))
    .orderBy(asc(brands.name));
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
  const rows = await db
    .select({
      min: sql<string>`coalesce(min(${products.price}), 0)`,
      max: sql<string>`coalesce(max(${products.price}), 0)`,
    })
    .from(products)
    .where(eq(products.status, "ACTIVE"));
  return {
    min: Math.floor(Number(rows[0]?.min ?? 0)),
    max: Math.ceil(Number(rows[0]?.max ?? 0)),
  };
}

export async function getProductImages(productId: string): Promise<string[]> {
  const rows = await db
    .select({ images: products.images })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  return rows[0]?.images ?? [];
}

export async function searchSuggestions(term: string, limit = 6) {
  if (term.trim().length < 2) return { products: [], categories: [] };
  const like = `%${term.trim()}%`;
  const [productRows, categoryRows] = await Promise.all([
    db
      .select({
        slug: products.slug,
        name: products.name,
        price: products.price,
        images: products.images,
      })
      .from(products)
      .where(and(eq(products.status, "ACTIVE"), ilike(products.name, like)))
      .limit(limit),
    db
      .select({ slug: categories.slug, name: categories.name })
      .from(categories)
      .where(and(eq(categories.isActive, true), ilike(categories.name, like)))
      .limit(3),
  ]);
  return { products: productRows, categories: categoryRows };
}

/** Public-safe product shape for cards (no cost price). */
export function toCardProduct(p: {
  id: string;
  slug: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  images: string[];
  ratingAvg: string;
  ratingCount: number;
  stock: number;
  brandName: string | null;
  categoryName: string | null;
  isFlashSale: boolean;
  flashSaleEndsAt: Date | null;
  shortDescription: string | null;
}) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    images: p.images,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    stock: p.stock,
    brandName: p.brandName,
    categoryName: p.categoryName,
    isFlashSale: p.isFlashSale,
    flashSaleEndsAt: p.flashSaleEndsAt,
    shortDescription: p.shortDescription,
  };
}

export type CardProduct = ReturnType<typeof toCardProduct>;
