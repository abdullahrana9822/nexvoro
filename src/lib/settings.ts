import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import type { HeroSlide } from "@/components/store/hero-slider";

export const DEFAULT_HERO: HeroSlide[] = [
  {
    eyebrow: "New season · Aurora Pro 16",
    title: "Built for the work you care about",
    subtitle:
      "3nm silicon, a 120Hz mini-LED display and 18-hour battery — the Aurora Pro 16 is the machine that keeps up.",
    ctaLabel: "Shop Aurora",
    ctaHref: "/product/aurora-pro-16-laptop",
    image: "/products/laptop-aurora-pro.svg",
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
  return Array.isArray(sections) && sections.length > 0 ? sections : DEFAULT_SECTIONS;
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
