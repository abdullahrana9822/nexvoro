"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { formatDate, formatMoney } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minSubtotal: string;
  maxDiscount: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | string | null;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs text-fg focus:border-brand focus:outline-none";

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: "",
    minSubtotal: "0",
    maxDiscount: "",
    maxUses: "",
    perUserLimit: "1",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          type: form.type,
          value: Number(form.value),
          minSubtotal: Number(form.minSubtotal || 0),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
          perUserLimit: Number(form.perUserLimit || 1),
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not create coupon");
      toast({ tone: "success", title: "Coupon created" });
      setForm({
        code: "",
        description: "",
        type: "PERCENTAGE",
        value: "",
        minSubtotal: "0",
        maxDiscount: "",
        maxUses: "",
        perUserLimit: "1",
      });
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

  async function toggle(coupon: Coupon) {
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      });
      if (!response.ok) throw new Error("Could not update coupon");
      toast({ tone: "info", title: coupon.isActive ? "Coupon paused" : "Coupon activated" });
      router.refresh();
    } catch {
      toast({ tone: "error", title: "Update failed" });
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
          <Plus className="size-3.5" aria-hidden /> New coupon
        </button>
      </div>

      {creating ? (
        <form onSubmit={create} className="panel space-y-3 p-5">
          <h2 className="text-sm font-bold text-fg">New coupon</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              placeholder="CODE"
              className={inputClass}
              aria-label="Coupon code"
            />
            <select
              value={form.type}
              onChange={(event) =>
                setForm({ ...form, type: event.target.value as "PERCENTAGE" | "FIXED" })
              }
              className={inputClass}
              aria-label="Discount type"
            >
              <option value="PERCENTAGE">Percentage off</option>
              <option value="FIXED">Fixed amount off</option>
            </select>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.value}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
              placeholder={form.type === "PERCENTAGE" ? "10 (%)" : "5000 (PKR)"}
              className={inputClass}
              aria-label="Discount value"
            />
            <input
              type="number"
              min="0"
              value={form.minSubtotal}
              onChange={(event) => setForm({ ...form, minSubtotal: event.target.value })}
              placeholder="Min subtotal"
              className={inputClass}
              aria-label="Minimum subtotal"
            />
            <input
              type="number"
              min="0"
              value={form.maxDiscount}
              onChange={(event) => setForm({ ...form, maxDiscount: event.target.value })}
              placeholder="Max discount (optional)"
              className={inputClass}
              aria-label="Maximum discount"
            />
            <input
              type="number"
              min="1"
              value={form.maxUses}
              onChange={(event) => setForm({ ...form, maxUses: event.target.value })}
              placeholder="Total uses (optional)"
              className={inputClass}
              aria-label="Maximum uses"
            />
          </div>
          <input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Description shown at checkout"
            className={inputClass}
            aria-label="Description"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-xs font-bold text-brand-fg disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            Create coupon
          </button>
        </form>
      ) : null}

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-xs">
            <thead className="border-b border-border bg-bg-muted/60">
              <tr className="text-[10px] uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5 font-bold">Code</th>
                <th className="px-4 py-2.5 font-bold">Discount</th>
                <th className="px-4 py-2.5 font-bold">Conditions</th>
                <th className="px-4 py-2.5 font-bold">Used</th>
                <th className="px-4 py-2.5 font-bold">Expires</th>
                <th className="px-4 py-2.5 font-bold">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-fg-subtle">
                    No coupons yet.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[11px] font-bold text-fg">
                        {coupon.code}
                      </span>
                      <p className="max-w-48 truncate text-[10px] text-fg-subtle">
                        {coupon.description}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-fg">
                      {coupon.type === "PERCENTAGE"
                        ? `${Number(coupon.value)}%`
                        : formatMoney(coupon.value)}
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-fg-muted">
                      min {formatMoney(coupon.minSubtotal)}
                      {coupon.maxDiscount ? ` · cap ${formatMoney(coupon.maxDiscount)}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-fg-muted">
                      {coupon.usedCount}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-2.5 text-fg-muted">
                      {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Never"}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => void toggle(coupon)}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          coupon.isActive
                            ? "bg-success/10 text-success"
                            : "bg-bg-muted text-fg-subtle"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Paused"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
