"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
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
  const [interacting, setInteracting] = useState(false);
  const go = useCallback((next: number) => {
    if (slides.length) setIndex(((next % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || interacting || slides.length <= 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, interacting, slides.length]);

  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  return (
    <section className="luxury-hero" aria-roledescription="carousel" aria-label="Featured collections"
      onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
      <Image src="/images/technology-editorial.webp" alt="Graphite headphones, a silver laptop and smartphone in a sculptural studio arrangement" fill priority sizes="100vw" className="luxury-hero-image" />
      <div className="luxury-hero-shade" />
      <div className="container-page relative z-10">
        <div className="luxury-hero-top"><span>THE NEXVORO EDIT</span><span>DESIGNED FOR WHAT’S NEXT</span></div>
        <div className="luxury-hero-copy">
          <p className="luxury-eyebrow"><span /> Where Innovation Meets Lifestyle</p>
          <h1>Extraordinary tech.<br /><span>Everyday possibility.</span></h1>
          <p className="luxury-hero-description">For the way you create. The way you connect. The way you live. Discover considered technology that makes every day feel different.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="luxury-button">Explore the collection <ArrowUpRight className="size-4" aria-hidden /></Link>
            <Link href="/shop?sort=newest" className="luxury-button luxury-button-ghost">Discover new arrivals</Link>
          </div>
        </div>
        <div className="luxury-hero-bottom">
          <a href="#curated-worlds" className="flex items-center gap-3 text-xs text-white/65"><ArrowDown className="size-4" aria-hidden /> Scroll to discover</a>
          <div className="luxury-slide-feature" aria-live="off">
            <span className="text-[10px] uppercase tracking-[.2em] text-white/45">In the spotlight · {String(index + 1).padStart(2, "0")}</span>
            <Link href={slide.ctaHref} className="mt-1 flex items-center gap-3 text-sm font-semibold">{slide.title} <ArrowUpRight className="size-4" aria-hidden /></Link>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? "Play promotions" : "Pause promotions"} className="luxury-carousel-button">{paused ? <Play className="size-3" /> : <Pause className="size-3" />}</button>
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous promotion" className="luxury-carousel-button"><ChevronLeft className="size-4" /></button>
            {slides.map((item, i) => <button key={`${item.title}-${i}`} type="button" aria-label={`Show promotion ${i + 1}`} aria-pressed={i === index} onClick={() => go(i)} className={cn("h-1 rounded-full transition-all", i === index ? "w-7 bg-white" : "w-3 bg-white/30")} />)}
            <button type="button" onClick={() => go(index + 1)} aria-label="Next promotion" className="luxury-carousel-button"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
