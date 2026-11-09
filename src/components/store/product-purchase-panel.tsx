"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShieldCheck, Truck, Zap } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { WishlistButton } from "@/components/store/add-to-cart-button";
import { cn, formatMoney } from "@/lib/utils";
import { MAX_CART_QUANTITY } from "@/lib/constants";

type Variant = {
  id: string;
  name: string;
  priceDelta: string;
  stock: number;
  options: Record<string, string>;
};

export function ProductPurchasePanel({
  productId,
  basePrice,
  stock,
  variants,
  isSaved,
  deliveryEstimate,
}: {
  productId: string;
  basePrice: string;
  stock: number;
  variants: Variant[];
  isSaved: boolean;
  deliveryEstimate: string;
}) {
  const { addItem, pending } = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => variants.find((variant) => variant.id === variantId) ?? null,
    [variants, variantId],
  );

  const available = selected ? selected.stock : stock;
  const unitPrice = Number(basePrice) + Number(selected?.priceDelta ?? 0);
  const maxQuantity = Math.min(MAX_CART_QUANTITY, Math.max(1, available));
  const outOfStock = available < 1;

  async function handleAdd(buyNow: boolean) {
    setBusy(true);
    const ok = await addItem({ productId, variantId, quantity });
    setBusy(false);
    if (ok && buyNow) router.push("/checkout");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-black tracking-tight text-fg">{formatMoney(unitPrice)}</p>
        {selected ? (
          <span className="text-[11px] font-semibold text-fg-subtle">{selected.name}</span>
        ) : null}
      </div>

      {variants.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-fg-subtle">
            Choose an option
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === variantId;
              const disabled = variant.stock < 1;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setVariantId(variant.id);
                    setQuantity(1);
                  }}
                  disabled={disabled}
                  aria-pressed={active}
                  className={cn(
                    "relative rounded-xl border px-3.5 py-2 text-left text-xs transition",
                    active
                      ? "border-brand bg-brand-soft text-brand ring-1 ring-brand"
                      : "border-border text-fg-muted hover:border-border-strong",
                    disabled && "cursor-not-allowed opacity-45 line-through",
                  )}
                >
                  <span className="block font-bold">{variant.name}</span>
                  <span className="mt-0.5 block text-[10px] opacity-80">
                    {variant.stock > 0 ? `${variant.stock} in stock` : "Sold out"}
                  </span>
                  {active ? (
                    <Check
                      className="absolute -right-1.5 -top-1.5 size-3.5 rounded-full bg-brand p-0.5 text-brand-fg"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="grid size-11 place-items-center rounded-full text-fg-muted transition hover:text-fg disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span aria-live="polite" className="min-w-8 text-center text-sm font-bold text-fg">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            className="grid size-11 place-items-center rounded-full text-fg-muted transition hover:text-fg disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        <span className="text-xs font-semibold text-fg-muted">
          {outOfStock
            ? "Currently out of stock"
            : available <= 5
              ? `Only ${available} left — order soon`
              : "In stock and ready to ship"}
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => handleAdd(false)}
          disabled={outOfStock || busy || pending}
          className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-50"
        >
          {outOfStock ? "Out of stock" : busy ? "Adding…" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={() => handleAdd(true)}
          disabled={outOfStock || busy || pending}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-fg px-6 text-sm font-bold text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          <Zap className="size-4" aria-hidden /> Buy now
        </button>
        <WishlistButton productId={productId} initiallySaved={isSaved} withLabel />
      </div>

      <dl className="grid gap-2 rounded-xl border border-border bg-bg-muted/60 p-4 text-xs sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <Truck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <div>
            <dt className="font-semibold text-fg">Delivery</dt>
            <dd className="text-fg-muted">{deliveryEstimate}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <div>
            <dt className="font-semibold text-fg">Warranty</dt>
            <dd className="text-fg-muted">Official warranty, serviced locally</dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
