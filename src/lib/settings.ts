import "server-only";
import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { banners, settings } from "@/db/schema";
import type { HeroSlide } from "@/components/store/hero-slider";

export const DEFAULT_HERO: HeroSlide[] = [
  {
    eyebrow: "WORK & CREATE",
    title: "Room for your next big idea",
    subtitle:
      "Explore laptops and thoughtful workspace essentials. Compare exact specifications before choosing your next machine.",
    ctaLabel: "Explore laptops",
    ctaHref: "/shop?category=laptops",
    image: "/products/laptop-aurora-pro.svg",
    tone: "brand",
  },
  {
    eyebrow: "SOUND & SILENCE",
    title: "Get closer to what moves you",
    subtitle:
      "Discover audio collections for focused work, everyday listening and the moments in between.",
    ctaLabel: "Explore audio",
    ctaHref: "/shop?category=headphones",
    image: "/products/audio-orbital-anc.svg",
    tone: "brand",
  },
  {
    eyebrow: "CONNECT & EXPLORE",
    title: "Your world. A new perspective.",
    subtitle:
      "Explore smartphones and find the features that matter to your everyday life.",
    ctaLabel: "Explore smartphones",
    ctaHref: "/shop?category=smartphones",
    image: "/products/phone-pulse-15-pro.svg",
    tone: "brand",
  },
];

export const DEFAULT_SECTIONS = [
  { id: "hero", enabled: true, title: "Hero slider" },
  { id: "categories", enabled: true, title: "Featured categories" },
  { id: "flash", enabled: true, title: "Flash sale" },
  { id: "featured", enabled: true, title: "Featured products" },
  { id: "trending", enabled: true, title: "Trending now" },
  { id: "bestsellers", enabled: true, title: "Best sellers" },
  { id: "testimonials", enabled: true, title: "Testimonials" },
  { id: "newsletter", enabled: true, title: "Newsletter" },
];

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const rows = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    if (!rows[0]) return fallback;
    return rows[0].value as T;
  } catch {
    return fallback;
  }
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const slides = await getSetting<HeroSlide[]>("homepage.hero", DEFAULT_HERO);
  return Array.isArray(slides) && slides.length > 0 ? slides : DEFAULT_HERO;
}

export async function getHomepageSections() {
  const sections = await getSetting("homepage.sections", DEFAULT_SECTIONS);
  return Array.isArray(sections) && sections.length > 0
    ? sections
    : DEFAULT_SECTIONS;
}

export async function getStoreProfile() {
  return getSetting("store.profile", {
    name: "NEXVORO",
    tagline: "Future-grade electronics, delivered.",
    supportEmail: "support@nexvoro.com",
    supportPhone: "+92 300 000 0000",
    address: "Level 8, Tech Tower, Gulberg III, Lahore, Pakistan",
  });
}

/* --------------------------------------------------------------- banners */

export type StoreBanner = {
  id: string;
  slot: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  tone: string;
};

/**
 * Active, in-window banners for a slot. Date windows are evaluated in the
 * database so the storefront never renders an expired promotion.
 */
export async function getBanners(slot = "homepage"): Promise<StoreBanner[]> {
  try {
    const rows = await db
      .select({
        id: banners.id,
        slot: banners.slot,
        eyebrow: banners.eyebrow,
        title: banners.title,
        subtitle: banners.subtitle,
        ctaLabel: banners.ctaLabel,
        ctaHref: banners.ctaHref,
        imageUrl: banners.imageUrl,
        tone: banners.tone,
      })
      .from(banners)
      .where(
        and(
          eq(banners.slot, slot),
          eq(banners.isActive, true),
          or(isNull(banners.startsAt), lte(banners.startsAt, new Date())),
          or(isNull(banners.endsAt), gte(banners.endsAt, new Date())),
        ),
      )
      .orderBy(asc(banners.position))
      .limit(6);
    return rows;
  } catch {
    return [];
  }
}
