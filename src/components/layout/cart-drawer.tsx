"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { ProductImage } from "@/components/ui/product-image";
import { formatMoney } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export function CartDrawer() {
  const { cart, isOpen, closeCart, updateItem, removeItem, pendingItemId } = useCart();
  const { totals, lines } = cart;

  const freeShippingProgress = Math.min(
    100,
    Math.round((totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100),
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[81] flex w-full max-w-md flex-col border-l border-border bg-bg-elevated shadow-lifted"
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-brand" aria-hidden />
                <h2 className="text-base font-bold text-fg">
                  Your cart
                  {totals.itemCount > 0 ? (
                    <span className="ml-1.5 text-xs font-semibold text-fg-subtle">
                      ({totals.itemCount})
                    </span>
                  ) : null}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="rounded-lg p-1.5 text-fg-muted transition hover:bg-bg-muted hover:text-fg"
                aria-label="Close cart"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <ShoppingBag className="size-7" aria-hidden />
                </div>
                <div>
                  <p className="text-base font-bold text-fg">Your cart is empty</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    Explore best sellers and new arrivals to get started.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-semibold text-brand-fg transition hover:brightness-110"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-border px-5 py-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-fg-muted">
                    <span>
                      {totals.shipping === 0
                        ? "You qualify for free delivery"
                        : `Spend ${formatMoney(totals.freeShippingRemaining)} more for free delivery`}
                    </span>
                    <span>{freeShippingProgress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>

                <ul className="flex-1 divide-y divide-border overflow-y-auto thin-scrollbar">
                  {lines.map((line) => (
                    <li key={line.itemId} className="flex gap-3 px-5 py-4">
                      <Link
                        href={`/product/${line.slug}`}
                        onClick={closeCart}
                        className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-bg-muted"
                      >
                        <ProductImage src={line.imageUrl} alt={line.name} sizes="80px" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${line.slug}`}
                            onClick={closeCart}
                            className="line-clamp-2 text-sm font-semibold text-fg hover:text-brand"
                          >
                            {line.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => void removeItem(line.itemId)}
                            disabled={pendingItemId === line.itemId}
                            className="rounded p-1 text-fg-subtle transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                            aria-label={`Remove ${line.name} from cart`}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </div>
                        {line.variantName ? (
                          <p className="mt-0.5 text-[11px] text-fg-subtle">{line.variantName}</p>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-border">
                            <button
                              type="button"
                              onClick={() => void updateItem(line.itemId, line.quantity - 1)}
                              disabled={pendingItemId === line.itemId}
                              className="grid size-8 place-items-center rounded-full text-fg-muted transition hover:text-fg disabled:opacity-50"
                              aria-label={`Decrease quantity of ${line.name}`}
                            >
                              <Minus className="size-3" aria-hidden />
                            </button>
                            <span className="min-w-6 text-center text-xs font-bold text-fg">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => void updateItem(line.itemId, line.quantity + 1)}
                              disabled={pendingItemId === line.itemId || line.quantity >= line.stock}
                              className="grid size-8 place-items-center rounded-full text-fg-muted transition hover:text-fg disabled:opacity-40"
                              aria-label={`Increase quantity of ${line.name}`}
                            >
                              <Plus className="size-3" aria-hidden />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-fg">
                            {formatMoney(line.lineTotal)}
                          </p>
                        </div>
                        {line.stock > 0 && line.stock <= 5 ? (
                          <p className="mt-1 text-[10px] font-semibold text-warning">
                            Only {line.stock} left
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="border-t border-border px-5 py-4">
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-fg-muted">
                      <dt>Subtotal</dt>
                      <dd className="font-semibold text-fg">{formatMoney(totals.subtotal)}</dd>
                    </div>
                    {totals.discount > 0 ? (
                      <div className="flex justify-between text-success">
                        <dt>Discount {cart.couponCode ? `(${cart.couponCode})` : ""}</dt>
                        <dd className="font-semibold">−{formatMoney(totals.discount)}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-fg-muted">
                      <dt>Delivery</dt>
                      <dd className="font-semibold text-fg">
                        {totals.shipping === 0 ? "Free" : formatMoney(totals.shipping)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 text-base">
                      <dt className="font-bold text-fg">Total</dt>
                      <dd className="font-bold text-fg">{formatMoney(totals.total)}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 grid gap-2">
                    <Link
                      href="/checkout"
                      onClick={closeCart}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg transition hover:brightness-110"
                    >
                      Checkout
                    </Link>
                    <Link
                      href="/cart"
                      onClick={closeCart}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-border text-sm font-semibold text-fg transition hover:bg-bg-muted"
                    >
                      View cart
                    </Link>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
