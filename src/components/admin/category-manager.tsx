"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

type Cat = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  position: number;
  isActive: boolean;
  isFeatured: boolean;
  productCount: number;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs text-fg focus:border-brand focus:outline-none";

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const roots = categories.filter((category) => !category.parentId);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    parentId: "",
    isFeatured: false,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not create the category");
      toast({ tone: "success", title: "Category created" });
      setForm({ name: "", slug: "", description: "", imageUrl: "", parentId: "", isFeatured: false });
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

  async function toggle(category: Cat, field: "isActive" | "isFeatured") {
    try {
      const response = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          [field]: !category[field],
        }),
      });
      if (!response.ok) throw new Error("Could not update");
      router.refresh();
    } catch {
      toast({ tone: "error", title: "Update failed" });
    }
  }

  async function disable(category: Cat) {
    if (!window.confirm(`Disable “${category.name}”? Products stay but the category is hidden.`))
      return;
    try {
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Could not disable");
      toast({ tone: "info", title: "Category disabled" });
      router.refresh();
    } catch {
      toast({ tone: "error", title: "Disable failed" });
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
          <Plus className="size-3.5" aria-hidden /> New category
        </button>
      </div>

      {creating ? (
        <form onSubmit={create} className="panel space-y-3 p-5">
          <h2 className="text-sm font-bold text-fg">New category</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Name"
              className={inputClass}
              aria-label="Category name"
            />
            <input
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="slug (optional)"
              className={inputClass}
              aria-label="Category slug"
            />
            <input
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="/products/cat-laptops.svg"
              className={inputClass}
              aria-label="Category image"
            />
            <select
              value={form.parentId}
              onChange={(event) => setForm({ ...form, parentId: event.target.value })}
              className={inputClass}
              aria-label="Parent category"
            >
              <option value="">Top-level category</option>
              {roots.map((root) => (
                <option key={root.id} value={root.id}>
                  Under {root.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Description (used for SEO)"
            rows={2}
            className="w-full rounded-xl border border-border bg-bg-elevated p-3 text-xs focus:border-brand focus:outline-none"
          />
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
              className="size-4 rounded border-border accent-[var(--theme-brand)]"
            />
            Show on the homepage
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-xs font-bold text-brand-fg disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            Create category
          </button>
        </form>
      ) : null}

      <ul className="space-y-2">
        {roots.map((root) => {
          const children = categories.filter((category) => category.parentId === root.id);
          return (
            <li key={root.id} className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-fg">{root.name}</p>
                  <p className="text-[10px] text-fg-subtle">
                    /{root.slug} · {root.productCount} products
                    {children.length > 0 ? ` · ${children.length} subcategories` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void toggle(root, "isActive")}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      root.isActive
                        ? "border-success/40 text-success"
                        : "border-border text-fg-subtle"
                    }`}
                  >
                    {root.isActive ? "Active" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggle(root, "isFeatured")}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      root.isFeatured
                        ? "border-brand/40 text-brand"
                        : "border-border text-fg-subtle"
                    }`}
                  >
                    {root.isFeatured ? "Featured" : "Not featured"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void disable(root)}
                    className="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-danger/10 hover:text-danger"
                    aria-label={`Disable ${root.name}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>

              {children.length > 0 ? (
                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {children.map((child) => (
                    <li
                      key={child.id}
                      className="flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="text-fg-muted">
                        — {child.name}
                        <span className="ml-1 text-[10px] text-fg-subtle">
                          ({child.productCount} products)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void toggle(child, "isActive")}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          child.isActive
                            ? "bg-success/10 text-success"
                            : "bg-bg-muted text-fg-subtle"
                        }`}
                      >
                        {child.isActive ? "Active" : "Hidden"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
