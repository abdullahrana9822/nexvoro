"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import { formatMoney } from "@/lib/utils";

type Suggestion = {
  products: { slug: string; name: string; price: string; images: string[] }[];
  categories: { slug: string; name: string }[];
};

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Suggestion>({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the query when the dialog closes, adjusting state during render
  // instead of synchronously inside an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setTerm("");
      setResults({ products: [], categories: [] });
    }
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (term.trim().length < 2) {
      const clear = window.setTimeout(
        () => setResults({ products: [], categories: [] }),
        0,
      );
      return () => window.clearTimeout(clear);
    }
    let cancelled = false;
    const start = window.setTimeout(() => setLoading(true), 0);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}`);
        if (!response.ok) return;
        const json = (await response.json()) as Suggestion;
        if (!cancelled) {
          setResults({
            products: json.products ?? [],
            categories: json.categories ?? [],
          });
        }
      } catch {
        /* ignore aborted searches */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
      window.clearTimeout(timer);
    };
  }, [term]);

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const query = term.trim();
      if (!query) return;
      onClose();
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [onClose, router, term],
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/55 p-4 pt-[8vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lifted"
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={submit} className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-5 shrink-0 text-fg-subtle" aria-hidden />
              <input
                ref={inputRef}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search laptops, phones, audio…"
                aria-label="Search products"
                className="h-14 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
              />
              {loading ? (
                <Loader2 className="size-4 animate-spin text-fg-subtle" aria-hidden />
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-fg"
                aria-label="Close search"
              >
                <X className="size-4" aria-hidden />
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto thin-scrollbar">
              {term.trim().length < 2 ? (
                <div className="px-4 py-6">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                    Popular searches
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["gaming laptop", "wireless earbuds", "4K monitor", "smartwatch", "drone"].map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setTerm(item)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:border-brand hover:text-brand"
                        >
                          {item}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {results.categories.length > 0 ? (
                <div className="border-b border-border px-4 py-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/shop?category=${category.slug}`}
                        onClick={onClose}
                        className="rounded-full bg-bg-muted px-3 py-1.5 text-xs font-semibold text-fg transition hover:bg-brand-soft hover:text-brand"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {results.products.length > 0 ? (
                <ul className="divide-y divide-border">
                  {results.products.map((product) => (
                    <li key={product.slug}>
                      <Link
                        href={`/product/${product.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-bg-muted"
                      >
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-bg-muted">
                          <ProductImage src={product.images[0]} alt={product.name} sizes="48px" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-fg">
                            {product.name}
                          </span>
                          <span className="text-xs text-fg-muted">
                            {formatMoney(product.price)}
                          </span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {term.trim().length >= 2 && !loading && results.products.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-fg-muted">
                  No products match “{term}”. Try a different phrase.
                </p>
              ) : null}

              {term.trim().length >= 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
                  }}
                  className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft"
                >
                  See all results for “{term.trim()}”
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
