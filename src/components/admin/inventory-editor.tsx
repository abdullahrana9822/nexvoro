"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export function StockCell({
  productId,
  stock,
  lowStockThreshold,
}: {
  productId: string;
  stock: number;
  lowStockThreshold: number;
}) {
  const [value, setValue] = useState(String(stock));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const dirty = Number(value) !== stock;

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, stock: Number(value) }),
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? "Could not update stock");
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Stock update failed",
        description: error instanceof Error ? error.message : undefined,
      });
      setValue(String(stock));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Stock quantity"
        className={`h-8 w-16 rounded-lg border px-2 text-xs font-semibold tabular-nums focus:outline-none ${
          Number(value) <= lowStockThreshold
            ? "border-warning/50 bg-warning/5 text-warning"
            : "border-border bg-bg-elevated text-fg"
        }`}
      />
      {dirty ? (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="grid size-7 place-items-center rounded-md bg-brand text-brand-fg disabled:opacity-60"
          aria-label="Save stock"
        >
          {saving ? (
            <Loader2 className="size-3 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3" strokeWidth={3} aria-hidden />
          )}
        </button>
      ) : saved ? (
        <span className="grid size-7 place-items-center rounded-md bg-success/10 text-success">
          <Check className="size-3" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
    </div>
  );
}
