import { CategoryExperience } from "@/components/store/experience-worlds";
import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import {
  getBrands,
  getCategoryTree,
  getPriceRange,
  listProducts,
  toCardProduct,
} from "@/lib/catalog";
import { productQuerySchema } from "@/lib/validation";
import { CatalogFilters, SortSelect } from "@/components/store/catalog-filters";
import { ProductGrid } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop all electronics",
  description:
    "Browse every NEXVORO product: laptops, smartphones, audio, wearables, cameras, monitors, tablets, accessories and smart home gear with genuine warranty.",
  alternates: { canonical: "/shop" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") flat[key] = value;
  }

  const parsed = productQuerySchema.safeParse(flat);
  const query = parsed.success ? parsed.data : {};

  const [result, categoryTree, brands, priceRange] = await Promise.all([
    listProducts({
      ...query,
      deals: query.deals === "true",
      inStock: query.inStock === "true",
    }),
    getCategoryTree(),
    getBrands(),
    getPriceRange(),
  ]);

  const categories = categoryTree.flatMap((category) => [
    { slug: category.slug, name: category.name, count: category.productCount },
    ...category.children.map((child) => ({
      slug: child.slug,
      name: `— ${child.name}`,
      count: undefined,
    })),
  ]);

  const activeFilters = [
    query.category ? `category: ${query.category}` : null,
    query.brand ? `brand: ${query.brand}` : null,
    query.max ? `max: ${query.max}` : null,
    query.rating ? `rating: ${query.rating}★+` : null,
    query.q ? `search: ${query.q}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="container-page py-8">
      <CategoryExperience category={query.category}/>
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-fg">Shop</span>
      </nav>

      <header className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg sm:text-3xl">
            {query.q ? `Results for “${query.q}”` : "All products"}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {result.total} product{result.total === 1 ? "" : "s"} available
            {query.category ? ` in ${query.category.replaceAll("-", " ")}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SortSelect />
        </div>
      </header>

      {activeFilters.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {activeFilters.map((label) => (
            <StatusPill
              key={label}
              className="bg-brand-soft text-brand ring-brand/20"
            >
              {label}
            </StatusPill>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <CatalogFilters
          categories={categories}
          brands={brands.map((brand) => ({ slug: brand.slug, name: brand.name }))}
          priceRange={priceRange}
        />

        <div>
          {result.items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-6" aria-hidden />}
              title="No products matched those filters"
              description="Try removing a filter, widening the price range, or searching for a different term."
              action={{ label: "Reset filters", href: "/shop" }}
            />
          ) : (
            <ProductGrid products={result.items.map(toCardProduct)} />
          )}

          {result.pageCount > 1 ? (
            <nav
              aria-label="Pagination"
              className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
            >
              {Array.from({ length: result.pageCount }, (_, index) => index + 1).map(
                (page) => {
                  const params = new URLSearchParams(flat);
                  params.set("page", String(page));
                  return (
                    <Link
                      key={page}
                      href={`/shop?${params.toString()}`}
                      aria-current={page === result.page ? "page" : undefined}
                      className={cn(
                        "grid size-9 place-items-center rounded-full border text-sm font-semibold transition",
                        page === result.page
                          ? "border-brand bg-brand text-brand-fg"
                          : "border-border text-fg-muted hover:border-brand hover:text-brand",
                      )}
                    >
                      {page}
                    </Link>
                  );
                },
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
