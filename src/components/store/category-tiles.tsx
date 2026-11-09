import Link from "next/link";
import { ProductImage } from "@/components/ui/product-image";
import type { CategoryNode } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {categories.slice(0, 6).map((category, index) => (
        <Link
          key={category.id}
          href={`/shop?category=${category.slug}`}
          className={cn(
            "group panel relative flex flex-col items-center gap-2 overflow-hidden p-4 text-center transition hover:border-brand hover:shadow-lifted",
            index === 0 && "sm:col-span-1",
          )}
        >
          <span className="relative size-16 overflow-hidden rounded-2xl bg-bg-muted">
            <ProductImage
              src={category.imageUrl}
              alt={category.name}
              sizes="64px"
              className="transition-transform duration-500 group-hover:scale-110"
            />
          </span>
          <span className="text-xs font-bold leading-tight text-fg group-hover:text-brand">
            {category.name}
          </span>
          <span className="text-[10px] text-fg-subtle">
            {category.productCount} item{category.productCount === 1 ? "" : "s"}
          </span>
        </Link>
      ))}
    </div>
  );
}
