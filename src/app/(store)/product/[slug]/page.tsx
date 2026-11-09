import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import {
  BadgeCheck,
  Check,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { db } from "@/db";
import { wishlistItems } from "@/db/schema";
import { getProductBySlug, getRelatedProducts, toCardProduct } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { canUserReview } from "@/lib/reviews";
import { env } from "@/lib/env";
import { SITE } from "@/lib/constants";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { ReviewForm } from "@/components/store/review-form";
import { ProductGrid } from "@/components/store/product-card";
import { Rating } from "@/components/ui/rating";
import { SectionHeading } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/badge";
import { cn, discountPercent, formatDate, formatMoney } from "@/lib/utils";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Product not found" };

  const { product } = data;
  return {
    title: { absolute: product.metaTitle ?? `${product.name} — ${SITE.name}` },
    description: product.metaDescription ?? product.shortDescription ?? undefined,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) notFound();

  const { product, variants, reviews } = data;
  const [related, user] = await Promise.all([
    getRelatedProducts({ id: product.id, categoryId: product.categoryId }, 4),
    getCurrentUser(),
  ]);

  const canReview = user ? await canUserReview(user.id, product.id) : false;
  const saved = user
    ? (
        await db
          .select({ productId: wishlistItems.productId })
          .from(wishlistItems)
          .where(
            and(
              eq(wishlistItems.userId, user.id),
              eq(wishlistItems.productId, product.id),
            ),
          )
          .limit(1)
      ).length > 0
    : false;

  const discount = discountPercent(product.price, product.compareAtPrice);
  const deliveryEstimate = "2–5 business days · free over PKR 150,000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? "",
    sku: product.sku,
    image: product.images.map((image) =>
      image.startsWith("http") ? image : `${env.NEXT_PUBLIC_APP_URL}${image}`,
    ),
    brand: product.brandName ? { "@type": "Brand", name: product.brandName } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${env.NEXT_PUBLIC_APP_URL}/product/${product.slug}`,
    },
    ...(Number(product.ratingCount) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: env.NEXT_PUBLIC_APP_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${env.NEXT_PUBLIC_APP_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${env.NEXT_PUBLIC_APP_URL}/product/${product.slug}`,
      },
    ],
  };

  const ratingBuckets = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));
  const reviewTotal = reviews.length || 1;

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        // Structured data is a trusted, server-generated constant.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <Link href="/shop" className="hover:text-brand">
          Shop
        </Link>
        {product.categorySlug ? (
          <>
            <span aria-hidden className="mx-1.5">/</span>
            <Link
              href={`/shop?category=${product.categorySlug}`}
              className="hover:text-brand"
            >
              {product.categoryName}
            </Link>
          </>
        ) : null}
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-fg">{product.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.brandName ? (
              <StatusPill className="bg-bg-muted text-fg-muted ring-border">
                {product.brandName}
              </StatusPill>
            ) : null}
            {product.isFlashSale ? (
              <StatusPill className="bg-warning/15 text-warning ring-warning/25">
                Flash sale
              </StatusPill>
            ) : null}
            {product.stock > 0 ? (
              <StatusPill className="bg-success/10 text-success ring-success/25">
                <Check className="size-3" aria-hidden /> In stock
              </StatusPill>
            ) : (
              <StatusPill className="bg-danger/10 text-danger ring-danger/25">
                Out of stock
              </StatusPill>
            )}
            {discount ? (
              <StatusPill className="bg-danger/10 text-danger ring-danger/25">
                Save {discount}%
              </StatusPill>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-fg sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Rating
              value={product.ratingAvg}
              count={product.ratingCount}
              size={15}
              showValue
            />
            <span className="text-xs text-fg-subtle">
              {product.soldCount} sold · SKU {product.sku}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-fg-muted">
            {product.shortDescription}
          </p>

          {product.compareAtPrice && discount ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-fg-subtle">
              <span className="line-through">{formatMoney(product.compareAtPrice)}</span>
              <span className="font-semibold text-success">
                You save {formatMoney(Number(product.compareAtPrice) - Number(product.price))}
              </span>
            </p>
          ) : null}

          <div className="mt-5">
            <ProductPurchasePanel
              productId={product.id}
              basePrice={product.price}
              stock={product.stock}
              isSaved={saved}
              deliveryEstimate={deliveryEstimate}
              variants={variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                priceDelta: variant.priceDelta,
                stock: variant.stock,
                options: variant.options,
              }))}
            />
          </div>

          <ul className="mt-5 grid gap-2 text-xs text-fg-muted sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <Truck className="size-4 shrink-0 text-brand" aria-hidden /> Free delivery over
              PKR 150,000
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw className="size-4 shrink-0 text-brand" aria-hidden /> 7-day easy
              returns
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden />
              {product.warrantyMonths}-month warranty
            </li>
            <li className="flex items-center gap-2">
              <Package className="size-4 shrink-0 text-brand" aria-hidden /> Sealed retail
              packaging
            </li>
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------- specification */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="panel p-6">
            <h2 className="text-lg font-bold text-fg">Overview</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
              {product.description}
            </p>
          </div>

          {product.specs.length > 0 ? (
            <div className="panel mt-4 p-6">
              <h2 className="text-lg font-bold text-fg">Specifications</h2>
              <dl className="mt-4 divide-y divide-border">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="grid grid-cols-[9rem_1fr] gap-3 py-2.5 text-sm"
                  >
                    <dt className="font-semibold text-fg-muted">{spec.label}</dt>
                    <dd className="text-fg">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {/* ------------------------------------------------------ reviews */}
          <section id="reviews" className="mt-8">
            <h2 className="text-lg font-bold text-fg">
              Reviews{" "}
              <span className="text-sm font-medium text-fg-subtle">
                ({reviews.length})
              </span>
            </h2>

            {reviews.length > 0 ? (
              <div className="panel mt-4 grid gap-6 p-6 sm:grid-cols-[10rem_1fr]">
                <div className="text-center sm:text-left">
                  <p className="text-4xl font-black text-fg">
                    {Number(product.ratingAvg).toFixed(1)}
                  </p>
                  <Rating value={product.ratingAvg} size={14} className="mt-1 justify-center sm:justify-start" />
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    {product.ratingCount} verified ratings
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {ratingBuckets.map((bucket) => (
                    <li key={bucket.stars} className="flex items-center gap-2 text-xs">
                      <span className="w-8 shrink-0 font-semibold text-fg-muted">
                        {bucket.stars}★
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg-muted">
                        <span
                          className="block h-full rounded-full bg-warning"
                          style={{
                            width: `${Math.round((bucket.count / reviewTotal) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className="w-6 shrink-0 text-right text-fg-subtle">
                        {bucket.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <ul className="mt-4 space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className="panel p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-fg">
                        {review.title ?? "Verified purchase"}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Rating value={review.rating} size={12} />
                        <span className="text-[11px] text-fg-subtle">
                          {review.authorName} · {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    <BadgeCheck className="size-4 shrink-0 text-success" aria-label="Verified" />
                  </div>
                  {review.body ? (
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">{review.body}</p>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="mt-4">
              <ReviewForm
                productId={product.id}
                signedIn={Boolean(user)}
                canReview={canReview}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <h2 className="text-sm font-bold text-fg">Delivery & returns</h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-fg-muted">
              <li>
                <strong className="text-fg">Standard:</strong> 2–5 business days. Free over PKR
                150,000, otherwise PKR 2,500.
              </li>
              <li>
                <strong className="text-fg">Express:</strong> next day in Lahore, Karachi and
                Islamabad.
              </li>
              <li>
                <strong className="text-fg">Returns:</strong> 7 days from delivery, unopened or
                faulty items.
              </li>
            </ul>
            <Link
              href="/shipping"
              className="mt-3 inline-block text-xs font-semibold text-brand hover:underline"
            >
              Full shipping policy →
            </Link>
          </div>

          <div className="panel p-5">
            <h2 className="text-sm font-bold text-fg">Buying from {SITE.name}</h2>
            <ul className="mt-3 space-y-2 text-xs text-fg-muted">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                Every unit is sourced through official distribution.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                Warranty claims handled in-house — no courier ping-pong.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                Cash on delivery available nationwide.
              </li>
            </ul>
          </div>

          {product.tags.length > 0 ? (
            <div className="panel p-5">
              <h2 className="text-sm font-bold text-fg">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/shop?q=${encodeURIComponent(tag)}`}
                    className={cn(
                      "rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-fg-muted transition hover:border-brand hover:text-brand",
                    )}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-14">
          <SectionHeading
            eyebrow="You may also like"
            title="Similar products"
            action={{ label: "Browse category", href: `/shop?category=${product.categorySlug ?? ""}` }}
          />
          <div className="mt-6">
            <ProductGrid products={related.map(toCardProduct)} className="xl:grid-cols-4" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
