import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { Rating } from "@/components/ui/rating";
import { AddToCartButton, WishlistButton } from "@/components/store/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import type { CardProduct } from "@/lib/catalog";
import { cn, discountPercent, formatMoney } from "@/lib/utils";

export function ProductCard({
  product,
  className,
  priority = false,
  savedIds,
}: {
  product: CardProduct;
  className?: string;
  priority?: boolean;
  savedIds?: string[];
}) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const lowStock = product.stock > 0 && product.stock <= 5;
  const outOfStock = product.stock <= 0;

  return (
    <article
      className={cn(
        "product-card-premium group panel flex flex-col overflow-hidden transition duration-300 hover:border-border-strong hover:shadow-lifted",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-bg-muted">
        {/*
         * `Image fill` positions itself against its nearest *positioned*
         * ancestor, and Next.js warns when that ancestor is `static`. The Link
         * therefore carries `relative` + a full-size block so the fill target
         * is the link itself rather than the outer container.
         */}
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="relative block size-full"
        >
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {discount ? (
            <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
              −{discount}%
            </span>
          ) : null}
          {product.isFlashSale ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-black">
              <Flame className="size-2.5" aria-hidden /> Flash
            </span>
          ) : null}
          {product.ratingAvg && Number(product.ratingAvg) >= 4.6 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-fg px-2 py-0.5 text-[10px] font-bold text-bg">
              <Sparkles className="size-2.5" aria-hidden /> Top rated
            </span>
          ) : null}
        </div>

        <div className="absolute right-2.5 top-2.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          <WishlistButton
            productId={product.id}
            initiallySaved={savedIds?.includes(product.id)}
            className="size-9 shadow-soft"
          />
        </div>

        {outOfStock ? (
          <div className="absolute inset-0 grid place-items-center bg-bg/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-fg px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-bg">
              Sold out
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">
          {product.brandName ? <span>{product.brandName}</span> : null}
          {product.brandName && product.categoryName ? <span aria-hidden>·</span> : null}
          {product.categoryName ? <span className="truncate">{product.categoryName}</span> : null}
        </div>

        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-fg">
          <Link href={`/product/${product.slug}`} className="transition hover:text-brand">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5">
          <Rating value={product.ratingAvg ?? 0} count={product.ratingCount ?? 0} size={12} />
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-fg">
            {formatMoney(product.price)}
          </span>
          {product.compareAtPrice && discount ? (
            <span className="text-xs text-fg-subtle line-through">
              {formatMoney(product.compareAtPrice)}
            </span>
          ) : null}
        </div>

        {lowStock ? (
          <p className="mt-1 text-[10px] font-bold text-warning">
            Only {product.stock} left in stock
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          <AddToCartButton
            productId={product.id}
            stock={product.stock}
            size="sm"
            className="w-full"
            label="Add to cart"
          />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  className,
  savedIds,
}: {
  products: CardProduct[];
  className?: string;
  savedIds?: string[];
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4}
          savedIds={savedIds}
        />
      ))}
    </div>
  );
}

export function ProductRail({
  products,
  savedIds,
}: {
  products: CardProduct[];
  savedIds?: string[];
}) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          className="w-[62%] shrink-0 snap-start sm:w-[42%] lg:w-auto"
          savedIds={savedIds}
        />
      ))}
    </div>
  );
}

export { Badge };
