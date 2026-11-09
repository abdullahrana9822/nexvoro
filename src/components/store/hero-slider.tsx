"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  tone: string;
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  return (
    <section
      className="hero-bg relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container-page grid items-center gap-8 py-10 lg:grid-cols-2 lg:py-16">
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
                {slide.eyebrow}
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.05] tracking-[-0.03em] text-fg sm:text-5xl lg:text-[3.4rem]">
                {slide.title}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-fg-muted sm:text-lg">
                {slide.subtitle}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={slide.ctaHref}
                  className="inline-flex h-12 items-center rounded-full bg-brand px-7 text-sm font-bold text-brand-fg shadow-[0_16px_40px_-16px_var(--theme-glow)] transition hover:brightness-110"
                >
                  {slide.ctaLabel}
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex h-12 items-center rounded-full border border-border-strong px-7 text-sm font-bold text-fg transition hover:border-brand hover:text-brand"
                >
                  Browse all products
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex gap-1.5" role="tablist" aria-label="Choose slide">
              {slides.map((item, i) => (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}: ${item.title}`}
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-8 bg-brand" : "w-4 bg-border-strong hover:bg-brand/50",
                  )}
                />
              ))}
            </div>
            <div className="ml-1 flex gap-1">
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="grid size-8 place-items-center rounded-full border border-border text-fg-muted transition hover:border-brand hover:text-brand"
                aria-label="Previous slide"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="grid size-8 place-items-center rounded-full border border-border text-fg-muted transition hover:border-brand hover:text-brand"
                aria-label="Next slide"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-6 rounded-full bg-brand/20 blur-3xl" aria-hidden />
          <AnimatePresence mode="wait">
            <motion.div
              key={`image-${index}`}
              initial={{ opacity: 0, scale: 0.94, rotate: -1.5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-surface shadow-lifted"
            >
              <ProductImage
                src={slide.image}
                alt={slide.title}
                priority={index === 0}
                sizes="(max-width: 1024px) 90vw, 480px"
              />
            </motion.div>
          </AnimatePresence>

          <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Authentic stock", value: "100%" },
              { label: "Orders shipped", value: "12k+" },
              { label: "Avg. rating", value: "4.8★" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-bg-elevated/70 px-2 py-2.5 backdrop-blur"
              >
                <dt className="text-[10px] font-medium uppercase tracking-wide text-fg-subtle">
                  {stat.label}
                </dt>
                <dd className="mt-0.5 text-sm font-extrabold text-fg">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
