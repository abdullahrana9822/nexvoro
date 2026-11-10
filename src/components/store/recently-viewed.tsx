"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductRail } from "@/components/store/product-card";
import type { CardProduct } from "@/lib/catalog";

const KEY = "nexvoro-recent-products";
function read(): string[] {
  try { const ids: unknown = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && /^[a-f0-9-]{36}$/i.test(id)).slice(0, 12) : []; }
  catch { return []; }
}
export function RecordProductView({ id }: { id: string }) {
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify([id, ...read().filter(item => item !== id)].slice(0, 12))); } catch { /* Storage may be disabled by the visitor. */ } }, [id]);
  return null;
}
export function RecentlyViewed({ standalone = false }: { standalone?: boolean }) {
  const [items, setItems] = useState<CardProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const ids = read();
    const load = async () => {
      try {
        if (!ids.length) return;
        const response = await fetch(`/api/products?ids=${ids.join(",")}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Could not load browsing history");
        const result = await response.json();
        setItems(ids.flatMap(id => result.items.filter((item: CardProduct) => item.id === id)));
      } catch { /* Keep the rest of the store usable if this optional rail fails. */ }
      finally { if (!controller.signal.aborted) setLoaded(true); }
    };
    void load(); return () => controller.abort();
  }, []);
  if (!standalone && !items.length) return null;
  return <section className="container-page py-12" aria-labelledby="recent-heading"><div className="mb-6 flex items-center justify-between gap-4"><div><p className="editorial-kicker text-fg-muted">PICK UP WHERE YOU LEFT OFF</p><h2 id="recent-heading" className="mt-3 text-3xl font-semibold tracking-tight">Your recent discoveries.</h2></div><Link href="/shop" className="text-xs text-brand">Continue exploring →</Link></div>{items.length ? <ProductRail products={items.slice(0, standalone ? 12 : 4)} /> : <p role="status" className="rounded-xl border border-border p-8 text-sm text-fg-muted">{loaded ? "Products you explore on this device will appear here. Browse the collection to get started." : "Loading your recent discoveries…"}</p>}<p className="mt-4 text-xs text-fg-subtle">History stays on this device. Prices and availability are fetched fresh from the catalogue.</p></section>;
}
