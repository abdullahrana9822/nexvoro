import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards against the class of bug that broke hydration on the homepage.
 *
 * These are source-level assertions rather than a rendering test: they encode
 * the exact rules that were violated, so the mistake cannot quietly return.
 */
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("hydration safety", () => {
  const countdown = read("src/components/store/countdown.tsx");

  it("countdown renders a fixed placeholder during SSR instead of the live clock", () => {
    // The server must not compute the remaining time: that value changes every
    // second and drifts from whatever the client computes.
    expect(countdown).toMatch(/const PLACEHOLDER: Remaining/);
    expect(countdown).toMatch(/useState<Remaining>\(PLACEHOLDER\)/);
  });

  it("countdown never reads the clock in a useState initialiser or render body", () => {
    const init = countdown.slice(0, countdown.indexOf("useEffect"));
    expect(init).not.toMatch(/useState\([^)]*Date\.now\(\)/);
    // A Date.now() call is only acceptable inside the effect/tick callback.
    const beforeEffect = countdown.slice(0, countdown.indexOf("useEffect"));
    expect(beforeEffect).not.toMatch(/Date\.now\(\)/);
  });

  it("countdown ticks from an effect, not during render", () => {
    expect(countdown).toMatch(/useEffect\(\(\) => \{/);
    expect(countdown).toMatch(/setInterval/);
  });

  it("footer year is a build-time constant, not a per-render clock read", () => {
    const footer = read("src/components/layout/site-footer.tsx");
    expect(footer).toMatch(/const COPYRIGHT_YEAR = \d{4}/);
    expect(footer).not.toMatch(/new Date\(\)\.getFullYear\(\)/);
  });
});

describe("next/image fill parents", () => {
  it("product card links are positioned so `fill` has a valid ancestor", () => {
    const card = read("src/components/store/product-card.tsx");
    // The Image's direct parent is the Link, so the Link itself must be
    // `relative`; relying on the grandparent's `relative` triggers
    // "parent element with invalid position" and breaks layout.
    expect(card).toMatch(/className="relative block size-full"/);
  });
});
