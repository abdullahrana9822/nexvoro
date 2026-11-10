"use client";
import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EXPERIENCES } from "@/lib/experiences";
type World = (typeof EXPERIENCES)[number];
function WorldCard({ world, index }: { world: World; index: number }) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), {
    stiffness: 140,
    damping: 25,
  });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 140,
    damping: 25,
  });
  return (
    <motion.article
      ref={root}
      initial={false}
      whileInView={reduced ? {} : { opacity: [0.55, 1], y: [25, 0] }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: (index % 2) * 0.1 }}
      className={`experience-world experience-${world.mode}`}
      style={
        {
          "--world-accent": world.accent,
          "--world-bg": world.surface,
          rotateX: reduced ? 0 : rx,
          rotateY: reduced ? 0 : ry,
          transformPerspective: 1200,
        } as CSSProperties
      }
      onPointerMove={(e) => {
        if (
          reduced ||
          e.pointerType !== "mouse" ||
          document.documentElement.dataset.motion === "none"
        )
          return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <div className="experience-atmosphere" aria-hidden />
      <div className="relative z-10 flex items-center justify-between text-[9px] tracking-[.22em]">
        <span>{world.eyebrow}</span>
        <span>{String(index + 1).padStart(2, "0")} / NEXVORO</span>
      </div>
      <div className="experience-product">
        <Image
          src={world.image}
          alt={`Illustrated ${world.category} collection`}
          fill
          sizes="(max-width: 640px) 90vw, 45vw"
          className="object-contain p-4"
        />
      </div>
      <div className="relative z-10 mt-auto">
        <h3 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">
          {world.name}
        </h3>
        <p className="mt-3 max-w-xs text-sm opacity-75">{world.description}</p>
        <Link
          href={`/shop?category=${world.category}`}
          className="mt-6 inline-flex items-center gap-5 rounded-full border border-current/30 px-5 py-3 text-xs font-semibold transition hover:bg-white/10"
        >
          Explore collection <ArrowUpRight size={15} />
        </Link>
      </div>
    </motion.article>
  );
}
export function ExperienceWorlds({ full = false }: { full?: boolean }) {
  return (
    <section
      className="container-page py-14"
      aria-labelledby="experience-heading"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="editorial-kicker text-brand">
            TECHNOLOGY IS ONLY THE BEGINNING
          </p>
          <h2
            id="experience-heading"
            className="mt-4 text-4xl font-medium tracking-[-.05em] sm:text-5xl"
          >
            Find your world.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-fg-muted">
            Ten perspectives on the things you love. Explore a collection that
            moves at your pace.
          </p>
        </div>
        {!full && (
          <Link href="/experiences" className="studio-secondary">
            Explore all ten worlds <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {(full
          ? EXPERIENCES
          : EXPERIENCES.filter((_, i) => [0, 4, 6, 7].includes(i))
        ).map((world, i) => (
          <WorldCard key={world.id} world={world} index={i} />
        ))}
      </div>
    </section>
  );
}
export function CategoryExperience({ category }: { category?: string }) {
  const world = EXPERIENCES.find((w) => w.category === category);
  if (!world) return null;
  return (
    <div className="mb-8">
      <WorldCard world={world} index={EXPERIENCES.indexOf(world)} />
    </div>
  );
}
