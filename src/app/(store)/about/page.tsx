import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Cpu, HeartHandshake, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About NEXVORO",
  description:
    "NEXVORO is an independent electronics retailer built on authentic stock, honest specifications and support that answers. Meet the team behind the store.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    Icon: ShieldCheck,
    title: "Authentic, always",
    copy: "Every unit is sourced through official distribution channels and arrives sealed with a valid local warranty.",
  },
  {
    Icon: PackageCheck,
    title: "Specs you can trust",
    copy: "We publish the numbers that matter and correct them when a manufacturer changes a spec — no marketing exaggeration.",
  },
  {
    Icon: HeartHandshake,
    title: "Support that answers",
    copy: "A real team in Lahore handles warranty claims, delivery issues and product questions, Monday to Saturday.",
  },
  {
    Icon: Truck,
    title: "Tracked end to end",
    copy: "Live order progress, and delivery is only completed when you confirm the parcel actually arrived.",
  },
];

const TIMELINE = [
  { year: "2021", title: "First warehouse", copy: "Started as a two-person operation selling laptops out of a single unit in Gulberg." },
  { year: "2023", title: "Nationwide delivery", copy: "Expanded to insured nationwide courier coverage with same-day options in three cities." },
  { year: "2025", title: "In-house service", copy: "Opened a service bench so warranty repairs no longer mean shipping devices abroad." },
  { year: "2026", title: "NEXVORO online", copy: "Launched this storefront with live tracking, customer-verified reviews and transparent pricing." },
];

export default function AboutPage() {
  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-fg">About</span>
      </nav>

      <section className="mt-4 grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
            <Sparkles className="size-3" aria-hidden /> Our story
          </p>
          <h1 className="mt-4 max-w-xl text-3xl font-black leading-[1.05] tracking-[-0.03em] text-fg sm:text-4xl">
            We sell electronics the way we would want to buy them.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base">
            {SITE.name} started in 2021 because buying a laptop in Pakistan was unnecessarily
            confusing: vague specifications, grey imports, and warranty promises that evaporated
            the moment something broke. We built the store we wanted to buy from — clear specs,
            authentic stock, honest delivery dates and a support team that picks up the phone.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-brand-fg"
            >
              Shop the range
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-fg transition hover:border-brand hover:text-brand"
            >
              Talk to us
            </Link>
          </div>
        </div>

        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-bg-muted">
          <Image
            src="/products/laptop-titan-creator.svg"
            alt="NEXVORO studio hardware"
            fill
            sizes="(max-width: 1024px) 90vw, 420px"
            unoptimized
            className="object-contain"
            priority
          />
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: "12k+", label: "Orders delivered" },
          { value: "4.8/5", label: "Average rating" },
          { value: "< 2h", label: "Median support reply" },
          { value: "7 days", label: "Return window" },
        ].map((stat) => (
          <div key={stat.label} className="panel p-5 text-center">
            <p className="text-2xl font-black text-fg">{stat.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-black tracking-tight text-fg">What we stand for</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {VALUES.map(({ Icon, title, copy }) => (
            <div key={title} className="panel flex gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-bold text-fg">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-black tracking-tight text-fg">How we got here</h2>
        <ol className="mt-5 space-y-3">
          {TIMELINE.map((item) => (
            <li key={item.year} className="panel flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:gap-6">
              <span className="shrink-0 text-sm font-black text-brand sm:w-16">{item.year}</span>
              <div>
                <p className="text-sm font-bold text-fg">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{item.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 panel grid gap-6 p-7 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-fg">
            Built on real operations, not drop-shipping
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            We hold stock in our own warehouse in Lahore, inspect units before dispatch, and run
            our own service bench for warranty work. That is why we can promise delivery dates
            and hold them.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-fg-muted">
            <li className="flex items-center gap-2">
              <Cpu className="size-3.5 text-brand" aria-hidden /> Devices are tested on arrival
              before they are listed.
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-brand" aria-hidden /> Warranty repairs
              handled in-house where possible.
            </li>
            <li className="flex items-center gap-2">
              <Truck className="size-3.5 text-brand" aria-hidden /> Insured courier partners with
              live tracking.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-bg-muted p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-subtle">
            Visit us
          </p>
          <p className="mt-2 text-sm font-semibold text-fg">{SITE.address}</p>
          <p className="mt-2 text-xs text-fg-muted">
            Mon–Sat, 9:00am – 7:00pm · {SITE.supportPhone}
            <br />
            {SITE.supportEmail}
          </p>
        </div>
      </section>
    </div>
  );
}
