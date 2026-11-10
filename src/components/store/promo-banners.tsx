import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { StoreBanner } from "@/lib/settings";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  brand: "border-brand/25 bg-brand-soft text-fg",
  dark: "border-zinc-800 bg-zinc-950 text-white",
  accent: "border-accent/25 bg-accent-soft text-fg",
  muted: "border-border bg-bg-muted text-fg",
};

/**
 * Admin-managed promotional strips.
 *
 * Renders nothing when there are no active banners, so the homepage falls back
 * to its built-in editorial layout instead of showing an empty container.
 */
export function PromoBanners({ banners }: { banners: StoreBanner[] }) {
  if (banners.length === 0) return null;

  return (
    <section aria-label="Current offers" className="container-page py-6">
      <div
        className={cn(
          "grid gap-4",
          banners.length === 1 ? "grid-cols-1" : "sm:grid-cols-2",
        )}
      >
        {banners.map((banner) => (
          <article
            key={banner.id}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 transition hover:shadow-soft",
              TONES[banner.tone] ?? TONES.brand,
            )}
          >
            {banner.eyebrow ? (
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
                {banner.eyebrow}
              </p>
            ) : null}
            <h3 className="mt-1.5 text-xl font-black leading-tight sm:text-2xl">
              {banner.title}
            </h3>
            {banner.subtitle ? (
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed opacity-75">
                {banner.subtitle}
              </p>
            ) : null}
            {banner.ctaHref ? (
              <Link
                href={banner.ctaHref}
                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-[11px] font-bold text-bg transition group-hover:gap-2.5"
              >
                {banner.ctaLabel ?? "Shop now"}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            ) : null}
            {banner.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-supplied SVG/remote URL
              <img
                src={banner.imageUrl}
                alt=""
                aria-hidden
                loading="lazy"
                className="pointer-events-none absolute -bottom-4 -right-4 size-32 object-contain opacity-25 transition group-hover:scale-105"
              />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
