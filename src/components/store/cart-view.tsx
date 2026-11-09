"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { ProductImage } from "@/components/ui/product-image";
import { formatMoney } from "@/lib/utils";

export function CartView() {
  const {
    cart,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    pendingItemId,
  } = useCart();
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  if (cart.lines.length === 0) {
    return (
      <div className="panel flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
          <ShoppingBag className="size-7" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-bold text-fg">Your cart is empty</h2>
        <p className="mt-1 max-w-sm text-sm text-fg-muted">
          Browse best sellers, new arrivals or today&apos;s deals to find something worth
          unboxing.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-brand-fg"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="panel divide-y divide-border">
        {cart.lines.map((line) => (
          <div key={line.itemId} className="flex gap-4 p-4">
            <Link
              href={`/product/${line.slug}`}
              className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-bg-muted"
            >
              <ProductImage src={line.imageUrl} alt={line.name} sizes="96px" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/product/${line.slug}`}
                    className="text-sm font-bold text-fg hover:text-brand"
                  >
                    {line.name}
                  </Link>
                  {line.variantName ? (
                    <p className="mt-0.5 text-[11px] text-fg-subtle">{line.variantName}</p>
                  ) : null}
                  <p className="mt-0.5 text-[11px] text-fg-subtle">SKU {line.sku}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeItem(line.itemId)}
                  disabled={pendingItemId === line.itemId}
                  className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                  aria-label={`Remove ${line.name}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    onClick={() => void updateItem(line.itemId, line.quantity - 1)}
                    disabled={pendingItemId === line.itemId}
                    className="grid size-9 place-items-center rounded-full text-fg-muted hover:text-fg disabled:opacity-40"
                    aria-label={`Decrease quantity of ${line.name}`}
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="min-w-7 text-center text-sm font-bold text-fg">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => void updateItem(line.itemId, line.quantity + 1)}
                    disabled={pendingItemId === line.itemId || line.quantity >= line.stock}
                    className="grid size-9 place-items-center rounded-full text-fg-muted hover:text-fg disabled:opacity-40"
                    aria-label={`Increase quantity of ${line.name}`}
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-fg">{formatMoney(line.lineTotal)}</p>
                  <p className="text-[11px] text-fg-subtle">
                    {formatMoney(line.unitPrice)} each
                  </p>
                </div>
              </div>

              {line.quantity > line.stock ? (
                <p className="mt-2 text-[11px] font-semibold text-danger">
                  Only {line.stock} available — reduce the quantity to continue.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <aside className="space-y-4">
        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Order summary</h2>

          <div className="mt-4">
            <label htmlFor="coupon" className="mb-1.5 block text-[11px] font-semibold text-fg-muted">
              Promo code
            </label>
            {cart.couponCode ? (
              <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-success">
                  <Tag className="size-3.5" aria-hidden /> {cart.couponCode}
                </span>
                <button
                  type="button"
                  onClick={() => void removeCoupon()}
                  className="rounded p-0.5 text-success hover:bg-success/20"
                  aria-label="Remove coupon"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!code.trim()) return;
                  setApplying(true);
                  await applyCoupon(code.trim());
                  setApplying(false);
                  setCode("");
                }}
                className="flex gap-2"
              >
                <input
                  id="coupon"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="NEX10"
                  maxLength={40}
                  className="h-10 flex-1 rounded-full border border-border bg-bg-elevated px-3.5 text-xs font-semibold uppercase tracking-wide text-fg focus:border-brand focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={applying || !code.trim()}
                  className="h-10 rounded-full bg-fg px-4 text-xs font-bold text-bg disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}
            {cart.couponMessage ? (
              <p className="mt-1.5 text-[11px] text-warning">{cart.couponMessage}</p>
            ) : null}
          </div>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-fg-muted">
              <dt>Subtotal ({cart.totals.itemCount} items)</dt>
              <dd className="font-semibold text-fg">{formatMoney(cart.totals.subtotal)}</dd>
            </div>
            {cart.totals.discount > 0 ? (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd className="font-semibold">−{formatMoney(cart.totals.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-fg-muted">
              <dt>Delivery</dt>
              <dd className="font-semibold text-fg">
                {cart.totals.shipping === 0 ? "Free" : formatMoney(cart.totals.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-bold text-fg">Total</dt>
              <dd className="font-black text-fg">{formatMoney(cart.totals.total)}</dd>
            </div>
          </dl>

          {cart.totals.freeShippingRemaining > 0 ? (
            <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-[11px] font-medium text-brand">
              Add {formatMoney(cart.totals.freeShippingRemaining)} more to unlock free delivery.
            </p>
          ) : null}

          <Link
            href="/checkout"
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg transition hover:brightness-110"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/shop"
            className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-full text-xs font-semibold text-fg-muted hover:text-brand"
          >
            Continue shopping
          </Link>
        </div>

        <div className="panel p-5 text-xs leading-relaxed text-fg-muted">
          <p className="font-semibold text-fg">Need a hand?</p>
          <p className="mt-1">
            Call <a href="tel:+923000000000" className="font-semibold text-brand">+92 300 000 0000</a>{" "}
            (Mon–Sat, 9am–7pm) or use the{" "}
            <Link href="/contact" className="font-semibold text-brand hover:underline">
              contact form
            </Link>
            .
          </p>
        </div>
      </aside>
    </div>
  );
}
