import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryTree } from "@/lib/catalog";
import { ProductImage } from "@/components/ui/product-image";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All categories",
  description:
    "Browse every NEXVORO department: laptops, smartphones, audio, wearables, cameras, monitors, tablets, accessories and smart home.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategoryTree();

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-fg">Categories</span>
      </nav>

      <h1 className="mt-3 text-2xl font-black tracking-tight text-fg sm:text-3xl">
        All departments
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-fg-muted">
        {categories.length} departments, each with hand-picked stock, full specifications and
        official warranty.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <section key={category.id} className="panel overflow-hidden">
            <Link
              href={`/shop?category=${category.slug}`}
              className="group flex items-center gap-4 border-b border-border p-4"
            >
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-bg-muted">
                <ProductImage
                  src={category.imageUrl}
                  alt={category.name}
                  sizes="64px"
                  className="transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-fg group-hover:text-brand">
                  {category.name}
                </span>
                <span className="mt-0.5 block text-[11px] text-fg-subtle">
                  {category.productCount} product{category.productCount === 1 ? "" : "s"}
                </span>
              </span>
              <span aria-hidden className="text-fg-subtle transition group-hover:translate-x-0.5">
                →
              </span>
            </Link>

            {category.children.length > 0 ? (
              <ul className="divide-y divide-border">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/shop?category=${child.slug}`}
                      className="flex items-center justify-between px-4 py-2.5 text-xs text-fg-muted transition hover:bg-bg-muted hover:text-brand"
                    >
                      {child.name}
                      <span className="text-[10px] text-fg-subtle">
                        {child.productCount} items
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
