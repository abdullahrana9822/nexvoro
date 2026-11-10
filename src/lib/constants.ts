import type { OrderStatus } from "@/db/schema";

export const SITE = {
  name: "NEXVORO",
  tagline: "Where Innovation Meets Lifestyle",
  description:
    "NEXVORO is a premium electronics storefront for laptops, smartphones, audio, wearables, cameras and smart home gear — authentic products, fast delivery and real support.",
  supportEmail: "support@nexvoro.com",
  supportPhone: "+92 300 000 0000",
  address: "Level 8, Tech Tower, Gulberg III, Lahore, Pakistan",
  socials: {
    x: "https://x.com/nexvoro",
    instagram: "https://instagram.com/nexvoro",
    youtube: "https://youtube.com/@nexvoro",
    linkedin: "https://linkedin.com/company/nexvoro",
  },
  currency: "PKR",
  locale: "en-PK",
} as const;

/* ------------------------------------------------------------------ themes */

export type ThemeId =
  | "light"
  | "dark"
  | "glass"
  | "frosted"
  | "futuristic"
  | "luxury"
  | "minimal"
  | "neon"
  | "titanium";

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  description: string;
  /** Preview swatch colours (hex) shown in the theme picker. */
  swatch: [string, string, string];
  isDark: boolean;
};

export const THEMES: ThemeDefinition[] = [
  { id: "titanium", name: "Titanium Pro", description: "Brushed silver, industrial precision and graphite detail.", swatch: ["#20252d", "#303741", "#c2cbd7"], isDark: true },
  {
    id: "light",
    name: "Premium Light",
    description: "Clean, airy and conversion-focused.",
    swatch: ["#ffffff", "#f3f5f9", "#4f46e5"],
    isDark: false,
  },
  {
    id: "dark",
    name: "Midnight Luxury",
    description: "Deep charcoal with vivid accents.",
    swatch: ["#0b0d12", "#151922", "#8b5cf6"],
    isDark: true,
  },
  {
    id: "glass",
    name: "Royal Purple",
    description: "Translucent panels over a colourful gradient.",
    swatch: ["#1b1035", "#2a1b52", "#22d3ee"],
    isDark: true,
  },
  {
    id: "frosted",
    name: "Frosted Glass",
    description: "Soft frosted layers with silver light.",
    swatch: ["#eef2f7", "#dbe3ee", "#0ea5e9"],
    isDark: false,
  },
  {
    id: "futuristic",
    name: "Cyber Neon",
    description: "HUD-style panels and electric cyan grids.",
    swatch: ["#04070f", "#0a1524", "#00e5ff"],
    isDark: true,
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Obsidian and champagne gold.",
    swatch: ["#0c0a09", "#1c1917", "#d4af37"],
    isDark: true,
  },
  {
    id: "minimal",
    name: "Arctic Minimal",
    description: "Editorial whitespace, monochrome type.",
    swatch: ["#ffffff", "#f5f5f5", "#111111"],
    isDark: false,
  },
  {
    id: "neon",
    name: "Neon",
    description: "Night-city neon with magenta glow.",
    swatch: ["#08040d", "#150a22", "#ff2d95"],
    isDark: true,
  },
];

export const DEFAULT_THEME: ThemeId = "light";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEMES.some((t) => t.id === value);
}

/* ------------------------------------------------------------------- fonts */

export type FontId = "outfit" | "manrope" | "inter" | "sora" | "dmsans" | "playfair";

export type FontDefinition = {
  id: FontId;
  name: string;
  stack: string;
  description: string;
  /** Google-Fonts style category used by the picker. */
  category: "Geometric" | "Neutral" | "Editorial" | "Technical";
};

/* Font files are self-hosted through @fontsource-variable packages, so no
 * external font CDN is required at runtime. */
export const FONTS: FontDefinition[] = [
  {
    id: "outfit",
    name: "Outfit",
    stack: "var(--font-outfit)",
    category: "Geometric",
    description: "Modern geometric sans — the NEXVORO default.",
  },
  {
    id: "manrope",
    name: "Manrope",
    stack: "var(--font-manrope)",
    category: "Neutral",
    description: "Balanced and highly legible at small sizes.",
  },
  {
    id: "inter",
    name: "Inter",
    stack: "var(--font-inter)",
    category: "Neutral",
    description: "The interface workhorse for dense UI.",
  },
  {
    id: "sora",
    name: "Sora",
    stack: "var(--font-sora)",
    category: "Technical",
    description: "Precise, technical, great for specs.",
  },
  {
    id: "dmsans",
    name: "DM Sans",
    stack: "var(--font-dm-sans)",
    category: "Geometric",
    description: "Friendly and compact for product grids.",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    stack: "var(--font-playfair)",
    category: "Editorial",
    description: "High-contrast serif for a luxury feel.",
  },
];

export const DEFAULT_FONT: FontId = "outfit";

export function isFontId(value: unknown): value is FontId {
  return typeof value === "string" && FONTS.some((f) => f.id === value);
}

/* ------------------------------------------------------------ order stages */

export type OrderStage = {
  status: OrderStatus;
  label: string;
  /** Progress percentage this stage represents (max 99 until confirmed). */
  progress: number;
  description: string;
  customerMessage: string;
};

/**
 * The automated lifecycle never passes 99% on its own. 100% (delivered) can
 * only be reached by explicit customer confirmation or an admin override.
 */
export const ORDER_STAGES: OrderStage[] = [
  {
    status: "PENDING",
    label: "Order placed",
    progress: 5,
    description: "Order received and awaiting review.",
    customerMessage: "We have your order. Our team is reviewing it now.",
  },
  {
    status: "CONFIRMED",
    label: "Confirmed",
    progress: 18,
    description: "Order confirmed and payment arranged.",
    customerMessage: "Your order is confirmed and is queued for the warehouse.",
  },
  {
    status: "PROCESSING",
    label: "Processing",
    progress: 34,
    description: "Items are being picked and quality-checked.",
    customerMessage: "We are picking and checking your items.",
  },
  {
    status: "PACKED",
    label: "Packed",
    progress: 49,
    description: "Packed and labelled, waiting for courier pickup.",
    customerMessage: "Your parcel is packed and awaits courier pickup.",
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    progress: 63,
    description: "In transit with the courier.",
    customerMessage: "Your parcel is on the way.",
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    progress: 82,
    description: "With the delivery rider in your area.",
    customerMessage: "Your parcel is out for delivery today.",
  },
  {
    status: "AWAITING_CONFIRMATION",
    label: "Awaiting your confirmation",
    progress: 99,
    description: "Delivered pending customer confirmation.",
    customerMessage:
      "Your parcel should have arrived. Please confirm delivery in your dashboard.",
  },
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  AWAITING_CONFIRMATION: "Awaiting confirmation",
  DELIVERED: "Delivered",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const STATUS_TONES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  CONFIRMED: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  PROCESSING:
    "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-400",
  PACKED: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
  SHIPPED: "bg-cyan-500/10 text-cyan-600 ring-cyan-500/20 dark:text-cyan-400",
  OUT_FOR_DELIVERY:
    "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400",
  AWAITING_CONFIRMATION:
    "bg-fuchsia-500/10 text-fuchsia-600 ring-fuchsia-500/20 dark:text-fuchsia-400",
  DELIVERED:
    "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  DISPUTED: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
  CANCELLED: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400",
  RETURNED: "bg-orange-500/10 text-orange-600 ring-orange-500/20 dark:text-orange-400",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
  COD_DUE: "Cash on delivery due",
};

/* ---------------------------------------------------------- storefront nav */

export type NavColumn = { title: string; links: NavLink[] };
export type NavLink = { label: string; href: string; badge?: string };
export type NavItem = {
  label: string;
  href: string;
  columns?: NavColumn[];
  featured?: { title: string; description: string; href: string; image: string };
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Explore", href: "/experiences" },
  { label: "Theme Studio", href: "/themes" },
  {
    label: "Shop",
    href: "/shop",
    columns: [
      {
        title: "Popular departments",
        links: [
          { label: "Laptops & Computers", href: "/shop?category=laptops" },
          { label: "Smartphones", href: "/shop?category=smartphones" },
          { label: "Audio", href: "/shop?category=audio" },
          { label: "Wearables", href: "/shop?category=wearables" },
          { label: "Cameras", href: "/shop?category=cameras" },
          { label: "Smart Home", href: "/shop?category=smart-home" },
        ],
      },
      {
        title: "Gaming & creators",
        links: [
          { label: "Gaming laptops", href: "/shop?category=gaming-laptops" },
          { label: "Monitors", href: "/shop?category=monitors" },
          { label: "Keyboards & mice", href: "/shop?category=accessories" },
          { label: "Creator cameras", href: "/shop?category=cameras" },
          { label: "Drones", href: "/shop?category=drones" },
        ],
      },
      {
        title: "Buying guides",
        links: [
          { label: "Best sellers", href: "/shop?sort=best-selling" },
          { label: "New arrivals", href: "/shop?sort=newest" },
      { label: "Recently viewed", href: "/recently-viewed" },
          { label: "Flash deals", href: "/shop?deals=true", badge: "HOT" },
          { label: "Under 50,000", href: "/shop?max=50000" },
        ],
      },
    ],
    featured: {
      title: "Aurora Pro 16",
      description: "3nm silicon, 120Hz mini-LED, 18-hour battery.",
      href: "/product/aurora-pro-16-laptop",
      image: "/products/laptop-aurora.svg",
    },
  },
  {
    label: "Categories",
    href: "/categories",
    columns: [
      {
        title: "Computing",
        links: [
          { label: "Laptops", href: "/shop?category=laptops" },
          { label: "Gaming laptops", href: "/shop?category=gaming-laptops" },
          { label: "Monitors", href: "/shop?category=monitors" },
          { label: "Accessories", href: "/shop?category=accessories" },
        ],
      },
      {
        title: "Mobile & wearable",
        links: [
          { label: "Smartphones", href: "/shop?category=smartphones" },
          { label: "Wearables", href: "/shop?category=wearables" },
          { label: "Tablets", href: "/shop?category=tablets" },
        ],
      },
      {
        title: "Audio & vision",
        links: [
          { label: "Headphones", href: "/shop?category=audio" },
          { label: "Cameras", href: "/shop?category=cameras" },
          { label: "Drones", href: "/shop?category=drones" },
          { label: "Smart home", href: "/shop?category=smart-home" },
        ],
      },
    ],
  },
  { label: "New arrivals", href: "/shop?sort=newest" },
  { label: "Deals", href: "/shop?deals=true" },
  { label: "Track order", href: "/track" },
  { label: "About", href: "/about" },
];

export const FOOTER_LINKS = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "The Journal", href: "/blog" },
      { label: "Technology explained", href: "/news" },
      { label: "Customer support", href: "/support" },
      { label: "Categories", href: "/categories" },
      { label: "New arrivals", href: "/shop?sort=newest" },
      { label: "Flash deals", href: "/shop?deals=true" },
      { label: "Best sellers", href: "/shop?sort=best-selling" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My dashboard", href: "/account" },
      { label: "Orders", href: "/account/orders" },
      { label: "Wishlist", href: "/account/wishlist" },
      { label: "Track order", href: "/track" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact us", href: "/contact" },
      { label: "FAQs", href: "/faq" },
      { label: "Reviews", href: "/shop?sort=top-rated" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms & conditions", href: "/terms" },
      { label: "Returns & refunds", href: "/returns" },
      { label: "Shipping policy", href: "/shipping" },
    ],
  },
];

export const TAX_RATE = 0; // Prices are tax-inclusive in the default configuration.
export const FREE_SHIPPING_THRESHOLD = 150_000;
export const SHIPPING_FLAT_RATE = 2_500;
export const MAX_CART_QUANTITY = 10;
export const PRODUCTS_PER_PAGE = 12;
