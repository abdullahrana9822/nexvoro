import { ExperienceWorlds } from "@/components/store/experience-worlds";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  CreditCard,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { getCategoryTree, getCollection, toCardProduct } from "@/lib/catalog";
import { getBanners, getHeroSlides, getHomepageSections } from "@/lib/settings";
import { EditorialCollections } from "@/components/store/editorial-collections";
import { HeroSlider } from "@/components/store/hero-slider";
import { CategoryTiles } from "@/components/store/category-tiles";
import { ProductGrid, ProductRail } from "@/components/store/product-card";
import { Countdown } from "@/components/store/countdown";
import { Testimonials } from "@/components/store/testimonials";
import { PromoBanners } from "@/components/store/promo-banners";
import { SectionHeading } from "@/components/ui/card";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { SITE } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export const revalidate = 120;

export const metadata: Metadata = {
  title: `${SITE.name} — Premium electronics, delivered`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [
    slides,
    sections,
    banners,
    categories,
    featured,
    trending,
    bestSellers,
    flash,
    newArrivals,
  ] = await Promise.all([
    getHeroSlides(),
    getHomepageSections(),
    getBanners("homepage"),
    getCategoryTree(),
    getCollection("featured", 8),
    getCollection("trending", 4),
    getCollection("best-sellers", 8),
    getCollection("flash-sale", 4),
    getCollection("new-arrivals", 4),
  ]);

  const enabled = (id: string) =>
    sections.find((section) => section.id === id)?.enabled !== false;

  const flashEnds = flash[0]?.flashSaleEndsAt
    ? new Date(flash[0].flashSaleEndsAt).toISOString()
    : null;

  const heroProduct = featured[0] ?? trending[0] ?? null;

  return (
    <>
      {enabled("hero") ? <HeroSlider slides={slides} /> : null}

      {/* trust bar */}
      <section
        aria-label="Why shop with NEXVORO"
        className="border-y border-border bg-bg-elevated"
      >
        <div className="container-page grid grid-cols-2 divide-x divide-border py-4 sm:grid-cols-4">
          {[
            { Icon: Truck, title: "Free delivery", copy: "Over PKR 150,000" },
            {
              Icon: ShieldCheck,
              title: "Genuine warranty",
              copy: "Official 12 months",
            },
            {
              Icon: RotateCcw,
              title: "7-day returns",
              copy: "No restocking fee",
            },
            {
              Icon: Headphones,
              title: "Real support",
              copy: "Mon–Sat, 9am–7pm",
            },
          ].map(({ Icon, title, copy }) => (
            <div
              key={title}
              className="flex items-center gap-2.5 px-3 first:pl-0"
            >
              <Icon className="size-5 shrink-0 text-brand" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-fg">{title}</p>
                <p className="truncate text-[11px] text-fg-subtle">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <EditorialCollections />
      <ExperienceWorlds />
      {enabled("new-arrivals") && newArrivals.length > 0 ? (
        <section className="container-page py-10">
          <SectionHeading
            eyebrow="JUST LANDED"
            title="A fresh perspective."
            action={{ href: "/shop?sort=newest", label: "Shop new arrivals" }}
          />
          <ProductGrid products={newArrivals.map(toCardProduct)} />
        </section>
      ) : null}
      <RecentlyViewed />
      <section
        className="container-page py-10"
        aria-labelledby="journal-home-heading"
      >
        <div className="panel flex flex-col justify-between gap-7 bg-bg-muted p-8 sm:flex-row sm:items-center sm:p-12">
          <div>
            <p className="editorial-kicker text-brand">THE NEXVORO JOURNAL</p>
            <h2
              id="journal-home-heading"
              className="mt-4 text-3xl font-semibold tracking-tight"
            >
              Better questions.
              <br />
              Better technology.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-fg-muted">
              Buying guides and clear explanations for a more considered digital
              life.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex shrink-0 items-center gap-6 self-start rounded-full border border-border-strong px-6 py-3 text-sm font-semibold"
          >
            Explore the Journal ↗
          </Link>
        </div>
      </section>

      {enabled("categories") ? (
        <section
          className="container-page py-12"
          aria-labelledby="categories-heading"
        >
          <SectionHeading
            eyebrow="Shop by category"
            title="Everything you need, curated"
            description="Discover your next essential, from pocket-sized power to a smarter home."
            action={{ label: "All categories", href: "/categories" }}
          />
          <div className="mt-6">
            <CategoryTiles
              categories={categories.filter((c) => c.isFeatured)}
            />
          </div>
        </section>
      ) : null}

      {enabled("flash") && flash.length > 0 ? (
        <section
          className="container-page py-6"
          aria-labelledby="flash-heading"
        >
          <div className="panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-r from-warning/15 via-transparent to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-warning/15 text-warning">
                  <Zap className="size-5" aria-hidden />
                </span>
                <div>
                  <h2
                    id="flash-heading"
                    className="text-lg font-extrabold text-fg"
                  >
                    Flash sale
                  </h2>
                  <p className="text-xs text-fg-muted">
                    Limited stock at sale prices — ends when the timer does.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Countdown endsAt={flashEnds} />
                <Link
                  href="/shop?deals=true"
                  className="hidden h-10 items-center rounded-full bg-fg px-4 text-xs font-bold text-bg sm:inline-flex"
                >
                  All deals
                </Link>
              </div>
            </div>
            <div className="p-4">
              <ProductGrid
                products={flash.map(toCardProduct)}
                className="xl:grid-cols-4"
              />
            </div>
          </div>
        </section>
      ) : null}

      <PromoBanners banners={banners} />

      {enabled("featured") ? (
        <section className="container-page py-12">
          <SectionHeading
            eyebrow="Featured"
            title="This month's headliners"
            description="The devices our team keeps recommending to friends."
            action={{ label: "Shop all", href: "/shop?sort=top-rated" }}
          />
          <div className="mt-6">
            <ProductGrid products={featured.map(toCardProduct)} />
          </div>
        </section>
      ) : null}

      {/* editorial split banner */}
      <section className="container-page py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="hero-bg panel relative overflow-hidden p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              Creator series
            </p>
            <h2 className="mt-2 max-w-xs text-2xl font-black leading-tight text-fg">
              Studio-grade gear for people who ship
            </h2>
            <p className="mt-2 max-w-sm text-sm text-fg-muted">
              Cameras, calibrated monitors and quiet keyboards that disappear
              when you are in flow.
            </p>
            <Link
              href="/shop?category=cameras"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-bold text-brand-fg"
            >
              Explore cameras
            </Link>
            <div className="pointer-events-none absolute -bottom-6 -right-2 w-40 opacity-90 sm:w-52">
              <Image
                src="/products/camera-lumen-r7.svg"
                alt=""
                width={240}
                height={240}
                aria-hidden
                unoptimized
              />
            </div>
          </div>

          <div className="panel relative overflow-hidden bg-bg-muted p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              Smart home
            </p>
            <h2 className="mt-2 max-w-xs text-2xl font-black leading-tight text-fg">
              A home that runs itself, locally
            </h2>
            <p className="mt-2 max-w-sm text-sm text-fg-muted">
              Matter and Thread devices with on-device automation — privacy
              included.
            </p>
            <Link
              href="/shop?category=smart-home"
              className="mt-5 inline-flex h-10 items-center rounded-full border border-border-strong px-5 text-sm font-bold text-fg"
            >
              Shop smart home
            </Link>
            <div className="pointer-events-none absolute -bottom-6 -right-2 w-36 opacity-90 sm:w-44">
              <Image
                src="/products/home-hub-mini.svg"
                alt=""
                width={240}
                height={240}
                aria-hidden
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {enabled("trending") && trending.length > 0 ? (
        <section className="container-page py-12">
          <SectionHeading
            eyebrow="Trending now"
            title="What everyone is looking at"
            action={{ label: "See more", href: "/shop?sort=newest" }}
          />
          <div className="mt-6">
            <ProductRail products={trending.map(toCardProduct)} />
          </div>
        </section>
      ) : null}

      {heroProduct ? (
        <section className="container-page py-6">
          <div className="panel grid items-center gap-6 overflow-hidden p-6 lg:grid-cols-[1.15fr_1fr] lg:p-8">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-success">
                <BadgeCheck className="size-3.5" aria-hidden /> Editor&apos;s
                pick
              </p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-fg sm:text-3xl">
                {heroProduct.name}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
                {heroProduct.shortDescription}
              </p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-fg">
                  {formatMoney(heroProduct.price)}
                </span>
                {heroProduct.compareAtPrice ? (
                  <span className="text-sm text-fg-subtle line-through">
                    {formatMoney(heroProduct.compareAtPrice)}
                  </span>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/product/${heroProduct.slug}`}
                  className="inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-brand-fg"
                >
                  View product
                </Link>
                <Link
                  href={`/shop?category=${heroProduct.categorySlug ?? ""}`}
                  className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-fg"
                >
                  Similar items
                </Link>
              </div>
            </div>
            <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-bg-muted">
              <Image
                src={heroProduct.images[0] ?? "/products/laptop-aurora-pro.svg"}
                alt={heroProduct.name}
                fill
                sizes="320px"
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </section>
      ) : null}

      {enabled("bestsellers") ? (
        <section className="container-page py-12">
          <SectionHeading
            eyebrow="Best sellers"
            title="Proven by thousands of orders"
            description="Ranked by units actually delivered, not by who paid for placement."
            action={{ label: "Best sellers", href: "/shop?sort=best-selling" }}
          />
          <div className="mt-6">
            <ProductGrid products={bestSellers.map(toCardProduct)} />
          </div>
        </section>
      ) : null}

      {enabled("testimonials") ? (
        <section className="container-page py-12">
          <SectionHeading
            eyebrow="Customer stories"
            title="Trusted across Pakistan"
            description="Real feedback from customers who bought, received and reviewed."
            align="center"
          />
          <div className="mt-6">
            <Testimonials />
          </div>
        </section>
      ) : null}

      {enabled("newsletter") ? (
        <section className="container-page py-12">
          <div className="hero-bg panel grid gap-6 p-7 md:grid-cols-[1.2fr_1fr] md:items-center lg:p-10">
            <div>
              <h2 className="text-2xl font-black leading-tight text-fg sm:text-3xl">
                Be first in line for the next drop
              </h2>
              <p className="mt-2 max-w-md text-sm text-fg-muted">
                Restocks, launch pricing and buying guides. Unsubscribe in one
                click — we never share your address.
              </p>
              <ul className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-fg-muted">
                <li className="flex items-center gap-1.5">
                  <CreditCard className="size-3.5 text-brand" aria-hidden />{" "}
                  Secure checkout
                </li>
                <li className="flex items-center gap-1.5">
                  <Truck className="size-3.5 text-brand" aria-hidden /> Tracked
                  delivery
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-brand" aria-hidden />{" "}
                  Buyer protection
                </li>
              </ul>
            </div>
            <NewsletterForm />
          </div>
        </section>
      ) : null}
    </>
  );
}
