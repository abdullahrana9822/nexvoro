"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";

type Option = { slug: string; name: string; count?: number };

export function CatalogFilters({
  categories,
  brands,
  priceRange,
}: {
  categories: Option[];
  brands: Option[];
  priceRange: { min: number; max: number };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const current = {
    category: params.get("category") ?? "",
    brand: params.get("brand") ?? "",
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    rating: params.get("rating") ?? "",
    inStock: params.get("inStock") ?? "",
  };

  const [maxPrice, setMaxPrice] = useState<number>(
    Number(current.max || priceRange.max) || priceRange.max,
  );

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      next.delete("page");
      router.push(`/shop?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const activeCount = [
    current.category,
    current.brand,
    current.min,
    current.max,
    current.rating,
    current.inStock,
  ].filter(Boolean).length;

  const body = (
    <div className="space-y-6">
      <FilterGroup title="Category">
        <ul className="space-y-1">
          <li>
            <FilterButton
              active={!current.category}
              onClick={() => push({ category: null })}
              label="All categories"
            />
          </li>
          {categories.map((category) => (
            <li key={category.slug}>
              <FilterButton
                active={current.category === category.slug}
                onClick={() => push({ category: category.slug })}
                label={category.name}
                count={category.count}
              />
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Brand">
        <ul className="space-y-1">
          <li>
            <FilterButton
              active={!current.brand}
              onClick={() => push({ brand: null })}
              label="All brands"
            />
          </li>
          {brands.map((brand) => (
            <li key={brand.slug}>
              <FilterButton
                active={current.brand === brand.slug}
                onClick={() => push({ brand: brand.slug })}
                label={brand.name}
              />
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="px-1">
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={5000}
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
            onMouseUp={() => push({ max: String(maxPrice) })}
            onTouchEnd={() => push({ max: String(maxPrice) })}
            onKeyUp={() => push({ max: String(maxPrice) })}
            aria-label="Maximum price"
            className="w-full accent-[var(--theme-brand)]"
          />
          <div className="mt-1 flex justify-between text-[11px] font-medium text-fg-muted">
            <span>{formatMoney(priceRange.min)}</span>
            <span className="font-bold text-fg">≤ {formatMoney(maxPrice)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[50000, 150000, 300000, 500000].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMaxPrice(value);
                  push({ max: String(value) });
                }}
                className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-fg-muted transition hover:border-brand hover:text-brand"
              >
                under {formatMoney(value)}
              </button>
            ))}
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="flex flex-wrap gap-1.5">
          {["4.5", "4", "3"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => push({ rating: current.rating === value ? null : value })}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                current.rating === value
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border text-fg-muted hover:border-brand hover:text-brand",
              )}
            >
              {value}★ & up
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <label className="flex cursor-pointer items-center gap-2 px-1 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={current.inStock === "true"}
            onChange={(event) =>
              push({ inStock: event.target.checked ? "true" : null })
            }
            className="size-4 rounded border-border accent-[var(--theme-brand)]"
          />
          In stock only
        </label>
      </FilterGroup>

      {activeCount > 0 ? (
        <button
          type="button"
          onClick={() =>
            push({
              category: null,
              brand: null,
              min: null,
              max: null,
              rating: null,
              inStock: null,
            })
          }
          className="w-full rounded-full border border-border py-2 text-xs font-bold text-fg-muted transition hover:border-danger hover:text-danger"
        >
          Clear all filters ({activeCount})
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-bg-elevated text-sm font-semibold text-fg lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {activeCount > 0 ? (
          <span className="grid size-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-fg">
            {activeCount}
          </span>
        ) : null}
      </button>

      <aside className="hidden lg:block">
        <div className="panel sticky top-24 p-5">{body}</div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-[78] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-bg-elevated p-5 thin-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-fg">Filters</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-bg-muted"
                aria-label="Close filters"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {body}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 h-12 w-full rounded-full bg-brand text-sm font-bold text-brand-fg"
            >
              Show results
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-fg-subtle">
        {title}
      </p>
      {children}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition",
        active
          ? "bg-brand-soft font-semibold text-brand"
          : "text-fg-muted hover:bg-bg-muted hover:text-fg",
      )}
    >
      <span className="truncate">{label}</span>
      {typeof count === "number" && count > 0 ? (
        <span className="shrink-0 text-[10px] text-fg-subtle">{count}</span>
      ) : null}
    </button>
  );
}

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "newest";

  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-fg-muted">
      <span className="hidden sm:inline">Sort</span>
      <select
        value={current}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", event.target.value);
          next.delete("page");
          router.push(`/shop?${next.toString()}`, { scroll: false });
        }}
        className="h-10 rounded-full border border-border bg-bg-elevated px-3 text-xs font-semibold text-fg focus:border-brand focus:outline-none"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="top-rated">Top rated</option>
        <option value="best-selling">Best selling</option>
      </select>
    </label>
  );
}
