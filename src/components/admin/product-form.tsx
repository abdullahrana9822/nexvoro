"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

type Option = { id: string; name: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  brandId: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  stock: string;
  lowStockThreshold: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isFlashSale: boolean;
  warrantyMonths: string;
  metaTitle: string;
  metaDescription: string;
  images: string[];
  specs: { label: string; value: string }[];
};

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  brandId: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  stock: "0",
  lowStockThreshold: "5",
  status: "DRAFT",
  isFeatured: false,
  isTrending: false,
  isBestSeller: false,
  isFlashSale: false,
  warrantyMonths: "12",
  metaTitle: "",
  metaDescription: "",
  images: [],
  specs: [],
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

const IMAGE_PRESETS = [
  "/products/laptop-aurora-pro.svg",
  "/products/laptop-zenith-gaming.svg",
  "/products/laptop-nova-air.svg",
  "/products/laptop-titan-creator.svg",
  "/products/phone-pulse-15.svg",
  "/products/phone-pulse-15-pro.svg",
  "/products/phone-edge-fold.svg",
  "/products/phone-nova-lite.svg",
  "/products/audio-orbital-anc.svg",
  "/products/audio-studio-true.svg",
  "/products/audio-sonic-bar.svg",
  "/products/audio-boom-portable.svg",
  "/products/watch-chrono-x.svg",
  "/products/watch-vitals-fit.svg",
  "/products/tablet-slate-11.svg",
  "/products/camera-lumen-r7.svg",
  "/products/camera-lumen-action.svg",
  "/products/drone-skylark-4k.svg",
  "/products/monitor-vista-27.svg",
  "/products/monitor-curve-34.svg",
  "/products/keyboard-mech-rgb.svg",
  "/products/keyboard-low-profile.svg",
  "/products/home-hub-mini.svg",
  "/products/home-clean-vac.svg",
];

export function ProductForm({
  initial,
  categories,
  brands,
}: {
  initial?: ProductFormValues;
  categories: Option[];
  brands: Option[];
}) {
  const [form, setForm] = useState<ProductFormValues>(initial ?? EMPTY_PRODUCT);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();

  const isEdit = Boolean(initial?.id);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        ...(isEdit ? { id: initial?.id } : {}),
        name: form.name,
        slug: form.slug || undefined,
        sku: form.sku,
        shortDescription: form.shortDescription,
        description: form.description,
        categoryId: form.categoryId || "",
        brandId: form.brandId || "",
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        status: form.status,
        isFeatured: form.isFeatured,
        isTrending: form.isTrending,
        isBestSeller: form.isBestSeller,
        isFlashSale: form.isFlashSale,
        warrantyMonths: Number(form.warrantyMonths),
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        images: form.images,
        specs: form.specs,
      };

      const response = await fetch("/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: Record<string, string>;
      };
      if (!response.ok) {
        if (json.fields) setErrors(json.fields);
        throw new Error(json.error ?? "Could not save the product");
      }
      toast({
        tone: "success",
        title: isEdit ? "Product updated" : "Product created",
        description: form.status === "DRAFT" ? "Saved as a draft." : "Live on the storefront.",
      });
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Save failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <div className="panel space-y-3 p-5">
          <h2 className="text-sm font-bold text-fg">Basics</h2>
          <div>
            <label htmlFor="p-name" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
              Product name
            </label>
            <input
              id="p-name"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={inputClass}
            />
            {errors.name ? <p className="mt-1 text-[11px] text-danger">{errors.name}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="p-slug" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                URL slug
              </label>
              <input
                id="p-slug"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                className={inputClass}
                placeholder="auto from name"
              />
            </div>
            <div>
              <label htmlFor="p-sku" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                SKU
              </label>
              <input
                id="p-sku"
                required
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
                className={inputClass}
                placeholder="NX-LT-XXXX"
              />
              {errors.sku ? <p className="mt-1 text-[11px] text-danger">{errors.sku}</p> : null}
            </div>
          </div>

          <div>
            <label htmlFor="p-short" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
              Short description (card + SEO)
            </label>
            <textarea
              id="p-short"
              value={form.shortDescription}
              onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
              rows={2}
              maxLength={400}
              className="w-full rounded-xl border border-border bg-bg-elevated p-3 text-xs focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="p-desc" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
              Full description
            </label>
            <textarea
              id="p-desc"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={6}
              className="w-full rounded-xl border border-border bg-bg-elevated p-3 text-xs focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div className="panel space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">Specifications</h2>
            <button
              type="button"
              onClick={() =>
                setForm({ ...form, specs: [...form.specs, { label: "", value: "" }] })
              }
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-fg-muted hover:border-brand hover:text-brand"
            >
              <Plus className="size-3" aria-hidden /> Add spec
            </button>
          </div>
          {form.specs.length === 0 ? (
            <p className="text-[11px] text-fg-subtle">
              No specs yet. Product pages show these in a table.
            </p>
          ) : (
            <ul className="space-y-2">
              {form.specs.map((spec, index) => (
                <li key={index} className="flex gap-2">
                  <input
                    value={spec.label}
                    onChange={(event) => {
                      const next = [...form.specs];
                      next[index] = { ...spec, label: event.target.value };
                      setForm({ ...form, specs: next });
                    }}
                    placeholder="Label"
                    className={inputClass}
                    aria-label={`Spec ${index + 1} label`}
                  />
                  <input
                    value={spec.value}
                    onChange={(event) => {
                      const next = [...form.specs];
                      next[index] = { ...spec, value: event.target.value };
                      setForm({ ...form, specs: next });
                    }}
                    placeholder="Value"
                    className={inputClass}
                    aria-label={`Spec ${index + 1} value`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, specs: form.specs.filter((_, i) => i !== index) })
                    }
                    className="grid size-10 shrink-0 place-items-center rounded-lg text-fg-subtle hover:bg-danger/10 hover:text-danger"
                    aria-label={`Remove spec ${index + 1}`}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel space-y-3 p-5">
          <h2 className="text-sm font-bold text-fg">Images</h2>
          <div className="flex flex-wrap gap-1.5">
            {IMAGE_PRESETS.map((image) => {
              const active = form.images.includes(image);
              return (
                <button
                  key={image}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      images: active
                        ? form.images.filter((item) => item !== image)
                        : [...form.images, image].slice(0, 8),
                    })
                  }
                  aria-pressed={active}
                  className={`relative size-14 overflow-hidden rounded-lg border bg-bg-muted transition ${
                    active ? "border-brand ring-1 ring-brand" : "border-border hover:border-border-strong"
                  }`}
                  title={image.split("/").pop()}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="size-full object-contain" />
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-fg-subtle">
            {form.images.length}/8 selected. Paste any external URL below to use your own photo.
          </p>
          <input
            placeholder="https://cdn.example.com/product.jpg — press Enter to add"
            className={inputClass}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const value = event.currentTarget.value.trim();
              if (!value) return;
              setForm({ ...form, images: [...form.images, value].slice(0, 8) });
              event.currentTarget.value = "";
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="panel space-y-3 p-5">
          <h2 className="text-sm font-bold text-fg">Pricing & stock</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-price" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                Price (PKR)
              </label>
              <input
                id="p-price"
                type="number"
                min="0"
                step="1"
                required
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                className={inputClass}
              />
              {errors.price ? <p className="mt-1 text-[11px] text-danger">{errors.price}</p> : null}
            </div>
            <div>
              <label htmlFor="p-compare" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                Compare at
              </label>
              <input
                id="p-compare"
                type="number"
                min="0"
                value={form.compareAtPrice}
                onChange={(event) => setForm({ ...form, compareAtPrice: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="p-cost" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                Cost (private)
              </label>
              <input
                id="p-cost"
                type="number"
                min="0"
                value={form.costPrice}
                onChange={(event) => setForm({ ...form, costPrice: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="p-warranty" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                Warranty (months)
              </label>
              <input
                id="p-warranty"
                type="number"
                min="0"
                value={form.warrantyMonths}
                onChange={(event) => setForm({ ...form, warrantyMonths: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="p-stock" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                Stock
              </label>
              <input
                id="p-stock"
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="p-low" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                Low stock at
              </label>
              <input
                id="p-low"
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="panel space-y-3 p-5">
          <h2 className="text-sm font-bold text-fg">Organisation</h2>
          <div>
            <label htmlFor="p-category" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
              Category
            </label>
            <select
              id="p-category"
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              className={inputClass}
            >
              <option value="">Uncategorised</option>
              {categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-brand" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
              Brand
            </label>
            <select
              id="p-brand"
              value={form.brandId}
              onChange={(event) => setForm({ ...form, brandId: event.target.value })}
              className={inputClass}
            >
              <option value="">No brand</option>
              {brands.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-status" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
              Status
            </label>
            <select
              id="p-status"
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as ProductFormValues["status"] })
              }
              className={inputClass}
            >
              <option value="DRAFT">Draft — hidden</option>
              <option value="ACTIVE">Active — on sale</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div className="panel space-y-2 p-5">
          <h2 className="text-sm font-bold text-fg">Merchandising</h2>
          {[
            { key: "isFeatured" as const, label: "Featured on homepage" },
            { key: "isTrending" as const, label: "Trending" },
            { key: "isBestSeller" as const, label: "Best seller" },
            { key: "isFlashSale" as const, label: "Flash sale" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 text-xs text-fg-muted">
              <input
                type="checkbox"
                checked={form[item.key]}
                onChange={(event) => setForm({ ...form, [item.key]: event.target.checked })}
                className="size-4 rounded border-border accent-[var(--theme-brand)]"
              />
              {item.label}
            </label>
          ))}
        </div>

        <div className="panel space-y-3 p-5">
          <h2 className="text-sm font-bold text-fg">SEO</h2>
          <input
            value={form.metaTitle}
            onChange={(event) => setForm({ ...form, metaTitle: event.target.value })}
            placeholder="Meta title"
            maxLength={160}
            className={inputClass}
            aria-label="Meta title"
          />
          <textarea
            value={form.metaDescription}
            onChange={(event) => setForm({ ...form, metaDescription: event.target.value })}
            placeholder="Meta description"
            rows={3}
            maxLength={320}
            className="w-full rounded-xl border border-border bg-bg-elevated p-3 text-xs focus:border-brand focus:outline-none"
            aria-label="Meta description"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-brand-fg disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {isEdit ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
