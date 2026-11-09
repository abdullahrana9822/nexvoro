import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { getCategoryTree, listProducts, toCardProduct } from "@/lib/catalog";
import { productQuerySchema } from "@/lib/validation";
import { ProductGrid } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search results",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const term = (q ?? "").trim();
  const parsed = productQuerySchema.safeParse({ q: term, page });

  const [result, categories] = await Promise.all([
    term && parsed.success
      ? listProducts({
          ...parsed.data,
          deals: parsed.data.deals === "true",
          inStock: parsed.data.inStock === "true",
        })
      : Promise.resolve({ items: [], total: 0, page: 1, pageCount: 0 }),
    getCategoryTree(),
  ]);

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-fg">Search</span>
      </nav>

      <h1 className="mt-3 text-2xl font-black tracking-tight text-fg sm:text-3xl">
        {term ? `Results for “${term}”` : "Search NEXVORO"}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        {term
          ? `${result.total} product${result.total === 1 ? "" : "s"} matched your search.`
          : "Use the search bar above to find products by name, brand or category."}
      </p>

      {term && result.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title={`Nothing found for “${term}”`}
            description="Check the spelling, try a broader term, or browse a department instead."
            action={{ label: "Browse all products", href: "/shop" }}
          />
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-subtle">
              Popular departments
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:border-brand hover:text-brand"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <ProductGrid products={result.items.map(toCardProduct)} />
        </div>
      )}
    </div>
  );
}
