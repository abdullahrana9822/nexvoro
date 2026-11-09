"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

const EMPTY = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Pakistan",
};

export function AddressBook({ initial }: { initial: Address[] }) {
  const [items, setItems] = useState(initial);
  const [showForm, setShowForm] = useState(initial.length === 0);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: Record<string, string>;
        address?: Address;
      };
      if (!response.ok) {
        if (json.fields) setErrors(json.fields);
        throw new Error(json.error ?? "Could not save address");
      }
      if (json.address) setItems((prev) => [...prev, json.address as Address]);
      setForm(EMPTY);
      setShowForm(false);
      toast({ tone: "success", title: "Address saved" });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not save address",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    try {
      const response = await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete address");
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({ tone: "info", title: "Address removed" });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not remove address",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((address) => (
            <li key={address.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand">
                    {address.label}
                    {address.isDefault ? " · default" : ""}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-fg">{address.fullName}</p>
                  <address className="mt-1 text-xs not-italic leading-relaxed text-fg-muted">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.country} · {address.phone}
                  </address>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(address.id)}
                  className="rounded-lg p-1.5 text-fg-subtle transition hover:bg-danger/10 hover:text-danger"
                  aria-label={`Delete address ${address.label}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {showForm ? (
        <form onSubmit={save} className="panel space-y-3 p-5">
          <p className="text-sm font-bold text-fg">Add a new address</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="addr-label" className="mb-1 block text-[11px] font-semibold text-fg-muted">
                Label
              </label>
              <input
                id="addr-label"
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="addr-name" className="mb-1 block text-[11px] font-semibold text-fg-muted">
                Full name
              </label>
              <input
                id="addr-name"
                required
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className={inputClass}
              />
              {errors.fullName ? (
                <p className="mt-1 text-[11px] text-danger">{errors.fullName}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="addr-phone" className="mb-1 block text-[11px] font-semibold text-fg-muted">
                Phone
              </label>
              <input
                id="addr-phone"
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className={inputClass}
              />
              {errors.phone ? (
                <p className="mt-1 text-[11px] text-danger">{errors.phone}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="addr-line1" className="mb-1 block text-[11px] font-semibold text-fg-muted">
                Street address
              </label>
              <input
                id="addr-line1"
                required
                value={form.line1}
                onChange={(event) => setForm({ ...form, line1: event.target.value })}
                className={inputClass}
              />
              {errors.line1 ? (
                <p className="mt-1 text-[11px] text-danger">{errors.line1}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="addr-city" className="mb-1 block text-[11px] font-semibold text-fg-muted">
                City
              </label>
              <input
                id="addr-city"
                required
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                className={inputClass}
              />
              {errors.city ? (
                <p className="mt-1 text-[11px] text-danger">{errors.city}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="addr-state" className="mb-1 block text-[11px] font-semibold text-fg-muted">
                Province / state
              </label>
              <input
                id="addr-state"
                required
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="addr-postal" className="mb-1 block text-[11px] font-semibold text-fg-muted">
                Postal code
              </label>
              <input
                id="addr-postal"
                required
                value={form.postalCode}
                onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="addr-country" className="mb-1 block text-[11px] font-semibold text-fg-muted">
                Country
              </label>
              <input
                id="addr-country"
                required
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-xs font-bold text-brand-fg disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
              Save address
            </button>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 rounded-full border border-border px-5 text-xs font-semibold text-fg"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-xs font-bold text-fg transition hover:border-brand hover:text-brand"
        >
          <Plus className="size-4" aria-hidden /> Add address
        </button>
      )}

      {items.length === 0 && !showForm ? (
        <p className="flex items-center gap-2 text-xs text-fg-subtle">
          <MapPin className="size-3.5" aria-hidden /> No addresses saved yet.
        </p>
      ) : null}
    </div>
  );
}
