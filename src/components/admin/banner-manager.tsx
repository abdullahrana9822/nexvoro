"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export type AdminBanner = {
  id: string;
  slot: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  tone: string;
  position: number;
  isActive: boolean;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs text-fg focus:border-brand focus:outline-none";

const EMPTY = {
  slot: "homepage",
  eyebrow: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  ctaHref: "",
  imageUrl: "",
  tone: "brand",
  position: "0",
};

export function BannerManager({ banners }: { banners: AdminBanner[] }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, position: Number(form.position) }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not create the banner");
      toast({ tone: "success", title: "Banner created" });
      setForm(EMPTY);
      setCreating(false);
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Create failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  async function toggle(banner: AdminBanner) {
    try {
      const response = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: banner.id, title: banner.title, isActive: !banner.isActive }),
      });
      if (!response.ok) throw new Error("Could not update the banner");
      router.refresh();
    } catch {
      toast({ tone: "error", title: "Update failed" });
    }
  }

  async function remove(banner: AdminBanner) {
    if (!window.confirm(`Delete “${banner.title}”? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/banners?id=${banner.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete the banner");
      toast({ tone: "info", title: "Banner deleted" });
      router.refresh();
    } catch {
      toast({ tone: "error", title: "Delete failed" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-bold text-brand-fg"
        >
          <Plus className="size-3.5" aria-hidden /> New banner
        </button>
      </div>

      {creating ? (
        <form onSubmit={create} className="panel space-y-3 p-5">
          <h2 className="text-sm font-bold text-fg">New banner</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Headline"
              className={inputClass}
              aria-label="Title"
            />
            <input
              value={form.eyebrow}
              onChange={(event) => setForm({ ...form, eyebrow: event.target.value })}
              placeholder="Eyebrow (optional)"
              className={inputClass}
              aria-label="Eyebrow"
            />
            <input
              value={form.subtitle}
              onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
              placeholder="Supporting line"
              className={inputClass}
              aria-label="Subtitle"
            />
            <input
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="/products/laptop-aurora-pro.svg"
              className={inputClass}
              aria-label="Image URL"
            />
            <input
              value={form.ctaLabel}
              onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })}
              placeholder="Button label"
              className={inputClass}
              aria-label="Button label"
            />
            <input
              value={form.ctaHref}
              onChange={(event) => setForm({ ...form, ctaHref: event.target.value })}
              placeholder="/shop?category=smartphones"
              className={inputClass}
              aria-label="Button link"
            />
            <select
              value={form.slot}
              onChange={(event) => setForm({ ...form, slot: event.target.value })}
              className={inputClass}
              aria-label="Placement"
            >
              <option value="homepage">Homepage promo</option>
              <option value="announcement">Announcement bar</option>
              <option value="category">Category strip</option>
              <option value="checkout">Checkout</option>
            </select>
            <select
              value={form.tone}
              onChange={(event) => setForm({ ...form, tone: event.target.value })}
              className={inputClass}
              aria-label="Tone"
            >
              <option value="brand">Brand</option>
              <option value="dark">Dark</option>
              <option value="accent">Accent</option>
              <option value="muted">Muted</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-xs font-bold text-brand-fg disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            Create banner
          </button>
        </form>
      ) : null}

      <ul className="space-y-2">
        {banners.length === 0 ? (
          <li className="panel p-8 text-center text-xs text-fg-subtle">
            No banners yet. The storefront falls back to its built-in hero and promo strips.
          </li>
        ) : (
          banners.map((banner) => (
            <li key={banner.id} className="panel flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wide text-fg-subtle">
                  {banner.slot} · position {banner.position} · {banner.tone}
                </p>
                <p className="mt-0.5 truncate text-sm font-bold text-fg">{banner.title}</p>
                {banner.subtitle ? (
                  <p className="max-w-md truncate text-[11px] text-fg-muted">{banner.subtitle}</p>
                ) : null}
                {banner.ctaHref ? (
                  <p className="mt-0.5 font-mono text-[10px] text-fg-subtle">
                    {banner.ctaLabel ?? "Open"} → {banner.ctaHref}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void toggle(banner)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    banner.isActive
                      ? "bg-success/10 text-success"
                      : "bg-bg-muted text-fg-subtle"
                  }`}
                >
                  {banner.isActive ? "Live" : "Paused"}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(banner)}
                  className="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-danger/10 hover:text-danger"
                  aria-label={`Delete ${banner.title}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
