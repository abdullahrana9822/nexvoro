"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Lock, Smartphone, Truck, Wallet } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ProductImage } from "@/components/ui/product-image";
import { cn, formatMoney } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  freeOver: string | null;
  minDays: number;
  maxDays: number;
};

type SavedAddress = {
  id: string;
  label: string;
  isDefault?: boolean;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-bg-elevated px-3.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

const METHODS = [
  { id: "COD", label: "Cash on delivery", Icon: Truck, hint: "Pay the rider when it arrives" },
  { id: "CARD", label: "Card", Icon: CreditCard, hint: "Secure online payment" },
  { id: "WALLET", label: "Wallet", Icon: Smartphone, hint: "Mobile wallet transfer" },
  { id: "BANK_TRANSFER", label: "Bank transfer", Icon: Wallet, hint: "Manual confirmation" },
] as const;

export function CheckoutForm({
  plans,
  savedAddresses,
  user,
  onlinePaymentsEnabled,
}: {
  plans: Plan[];
  savedAddresses: SavedAddress[];
  user: { email: string; firstName: string; lastName: string; phone: string | null } | null;
  onlinePaymentsEnabled: boolean;
}) {
  const { cart, refresh } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const defaultAddress = savedAddresses.find((address) => address.isDefault) ?? savedAddresses[0] ?? null;

  const [form, setForm] = useState(() => ({
    email: user?.email ?? "",
    phone: defaultAddress?.phone ?? user?.phone ?? "",
    fullName:
      defaultAddress?.fullName ?? (user ? `${user.firstName} ${user.lastName}`.trim() : ""),
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    postalCode: defaultAddress?.postalCode ?? "",
    country: defaultAddress?.country ?? "Pakistan",
    notes: "",
    saveAddress: Boolean(user),
    couponCode: cart.couponCode ?? "",
  }));

  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("COD");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? plans[0] ?? null,
    [plans, planId],
  );

  const shippingCost = useMemo(() => {
    if (!selectedPlan) return cart.totals.shipping;
    const threshold = selectedPlan.freeOver ? Number(selectedPlan.freeOver) : Infinity;
    const afterDiscount = cart.totals.subtotal - cart.totals.discount;
    return afterDiscount >= threshold ? 0 : Number(selectedPlan.price);
  }, [selectedPlan, cart.totals]);

  const grandTotal = cart.totals.subtotal - cart.totals.discount + shippingCost + cart.totals.tax;

  function applySavedAddress(address: SavedAddress) {
    setForm((prev) => ({
      ...prev,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod: method,
          shippingPlanId: planId,
          couponCode: cart.couponCode ?? "",
        }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: Record<string, string>;
        order?: { id: string; orderNumber: string };
      };

      if (!response.ok) {
        if (json.fields) setErrors(json.fields);
        setFormError(json.error ?? "Could not place your order");
        return;
      }

      toast({
        tone: "success",
        title: "Order placed",
        description: `Your order ${json.order?.orderNumber} is confirmed.`,
      });
      await refresh();
      router.push(`/checkout/success?order=${json.order?.orderNumber ?? ""}`);
      router.refresh();
    } catch {
      setFormError("Network error — your card has not been charged. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <h2 className="text-lg font-bold text-fg">Nothing to check out yet</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Add a product to your cart and it will appear here.
        </p>
        <Link
          href="/shop"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-brand-fg"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]" noValidate>
      <div className="space-y-4">
        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs font-medium text-danger"
          >
            {formError}
          </div>
        ) : null}

        {savedAddresses.length > 0 ? (
          <div className="panel p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-fg-subtle">
              Saved addresses
            </p>
            <div className="flex flex-wrap gap-2">
              {savedAddresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  onClick={() => applySavedAddress(address)}
                  className="rounded-xl border border-border px-3 py-2 text-left text-xs text-fg-muted transition hover:border-brand hover:text-brand"
                >
                  <span className="block font-bold text-fg">{address.label}</span>
                  {address.line1}, {address.city}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Contact</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="co-email" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                Email
              </label>
              <input
                id="co-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className={inputClass}
                autoComplete="email"
                aria-invalid={Boolean(errors.email) || undefined}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-danger">{errors.email}</p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-phone" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                Phone
              </label>
              <input
                id="co-phone"
                type="tel"
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className={inputClass}
                autoComplete="tel"
                placeholder="+92 300 1234567"
                aria-invalid={Boolean(errors.phone) || undefined}
              />
              {errors.phone ? <p className="mt-1 text-xs text-danger">{errors.phone}</p> : null}
            </div>
          </div>
          {!user ? (
            <p className="mt-3 text-[11px] text-fg-muted">
              Have an account?{" "}
              <Link href="/login?next=/checkout" className="font-semibold text-brand hover:underline">
                Sign in
              </Link>{" "}
              for faster checkout.
            </p>
          ) : null}
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Delivery address</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="co-name" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                Full name
              </label>
              <input
                id="co-name"
                required
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className={inputClass}
                autoComplete="name"
              />
              {errors.fullName ? (
                <p className="mt-1 text-xs text-danger">{errors.fullName}</p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-line1" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                Street address
              </label>
              <input
                id="co-line1"
                required
                value={form.line1}
                onChange={(event) => setForm({ ...form, line1: event.target.value })}
                className={inputClass}
                autoComplete="address-line1"
                placeholder="House / flat, street"
              />
              {errors.line1 ? (
                <p className="mt-1 text-xs text-danger">{errors.line1}</p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-line2" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                Apartment, area (optional)
              </label>
              <input
                id="co-line2"
                value={form.line2}
                onChange={(event) => setForm({ ...form, line2: event.target.value })}
                className={inputClass}
                autoComplete="address-line2"
              />
            </div>
            <div>
              <label htmlFor="co-city" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                City
              </label>
              <input
                id="co-city"
                required
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                className={inputClass}
                autoComplete="address-level2"
              />
              {errors.city ? <p className="mt-1 text-xs text-danger">{errors.city}</p> : null}
            </div>
            <div>
              <label htmlFor="co-state" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                Province / state
              </label>
              <input
                id="co-state"
                required
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
                className={inputClass}
                autoComplete="address-level1"
              />
              {errors.state ? <p className="mt-1 text-xs text-danger">{errors.state}</p> : null}
            </div>
            <div>
              <label htmlFor="co-postal" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                Postal code
              </label>
              <input
                id="co-postal"
                required
                value={form.postalCode}
                onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
                className={inputClass}
                autoComplete="postal-code"
              />
              {errors.postalCode ? (
                <p className="mt-1 text-xs text-danger">{errors.postalCode}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="co-country" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                Country
              </label>
              <input
                id="co-country"
                required
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
                className={inputClass}
                autoComplete="country-name"
              />
            </div>
          </div>

          {user ? (
            <label className="mt-3 flex items-center gap-2 text-xs text-fg-muted">
              <input
                type="checkbox"
                checked={form.saveAddress}
                onChange={(event) => setForm({ ...form, saveAddress: event.target.checked })}
                className="size-4 rounded border-border accent-[var(--theme-brand)]"
              />
              Save this address to my account
            </label>
          ) : null}
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Delivery speed</h2>
          <div className="mt-3 grid gap-2">
            {plans.map((plan) => (
              <label
                key={plan.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition",
                  planId === plan.id
                    ? "border-brand bg-brand-soft"
                    : "border-border hover:border-border-strong",
                )}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping-plan"
                    value={plan.id}
                    checked={planId === plan.id}
                    onChange={() => setPlanId(plan.id)}
                    className="size-4 accent-[var(--theme-brand)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-fg">{plan.name}</span>
                    <span className="block text-[11px] text-fg-muted">
                      {plan.description} ({plan.minDays}–{plan.maxDays} days)
                    </span>
                  </span>
                </span>
                <span className="text-sm font-bold text-fg">
                  {Number(plan.price) === 0 ? "Free" : formatMoney(plan.price)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Payment</h2>
          {!onlinePaymentsEnabled ? (
            <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-[11px] font-medium text-warning">
              Online card payments are not configured on this deployment yet. Cash on delivery
              and bank transfer work today.
            </p>
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {METHODS.map(({ id, label, Icon, hint }) => {
              const disabled =
                (id === "CARD" || id === "WALLET") && !onlinePaymentsEnabled;
              return (
                <label
                  key={id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition",
                    method === id
                      ? "border-brand bg-brand-soft"
                      : "border-border hover:border-border-strong",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={id}
                    checked={method === id}
                    disabled={disabled}
                    onChange={() => setMethod(id)}
                    className="mt-0.5 size-4 accent-[var(--theme-brand)]"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                      <Icon className="size-3.5" aria-hidden /> {label}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-fg-muted">{hint}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <label htmlFor="co-notes" className="mt-4 mb-1.5 block text-xs font-semibold text-fg-muted">
            Order notes (optional)
          </label>
          <textarea
            id="co-notes"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            rows={2}
            maxLength={1000}
            className="w-full rounded-xl border border-border bg-bg-elevated p-3 text-sm focus:border-brand focus:outline-none"
            placeholder="Delivery instructions, landmarks…"
          />
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Your order</h2>
          <ul className="mt-3 space-y-3">
            {cart.lines.map((line) => (
              <li key={line.itemId} className="flex gap-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-muted">
                  <ProductImage src={line.imageUrl} alt={line.name} sizes="56px" />
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-fg text-[10px] font-bold text-bg">
                    {line.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-fg">
                    {line.name}
                  </span>
                  {line.variantName ? (
                    <span className="block text-[10px] text-fg-subtle">{line.variantName}</span>
                  ) : null}
                </span>
                <span className="text-xs font-bold text-fg">{formatMoney(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-fg-muted">
              <dt>Subtotal</dt>
              <dd className="font-semibold text-fg">{formatMoney(cart.totals.subtotal)}</dd>
            </div>
            {cart.totals.discount > 0 ? (
              <div className="flex justify-between text-success">
                <dt>Discount {cart.couponCode ? `(${cart.couponCode})` : ""}</dt>
                <dd className="font-semibold">−{formatMoney(cart.totals.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-fg-muted">
              <dt>Delivery</dt>
              <dd className="font-semibold text-fg">
                {shippingCost === 0 ? "Free" : formatMoney(shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-bold text-fg">Total</dt>
              <dd className="font-black text-fg">{formatMoney(grandTotal)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
            Place order
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-fg-subtle">
            <Lock className="size-3" aria-hidden /> Prices, stock and totals are verified
            server-side before the order is created.
          </p>
        </div>
      </aside>
    </form>
  );
}
