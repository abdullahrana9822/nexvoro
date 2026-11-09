"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  productId,
  stock,
  label = "Add to cart",
  size = "md",
  className,
  variantId,
  quantity = 1,
}: {
  productId: string;
  stock: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  variantId?: string | null;
  quantity?: number;
}) {
  const { addItem, pending } = useCart();
  const [busy, setBusy] = useState(false);
  const outOfStock = stock <= 0;

  const heights = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-13 px-7 text-base",
  } as const;

  return (
    <button
      type="button"
      disabled={outOfStock || busy || pending}
      onClick={async () => {
        setBusy(true);
        await addItem({ productId, variantId, quantity });
        setBusy(false);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition disabled:opacity-50",
        outOfStock
          ? "cursor-not-allowed bg-bg-muted text-fg-subtle"
          : "bg-brand text-brand-fg hover:brightness-110",
        heights[size],
        className,
      )}
    >
      {outOfStock ? (
        "Out of stock"
      ) : (
        <>
          <ShoppingBag className="size-4" aria-hidden />
          {busy ? "Adding…" : label}
        </>
      )}
    </button>
  );
}

export function WishlistButton({
  productId,
  initiallySaved = false,
  className,
  withLabel = false,
}: {
  productId: string;
  initiallySaved?: boolean;
  className?: string;
  withLabel?: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function toggle() {
    setBusy(true);
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (response.status === 401) {
        toast({
          tone: "info",
          title: "Sign in to save items",
          description: "Create a free account to keep a wishlist across devices.",
        });
        router.push("/login?next=/account/wishlist");
        return;
      }
      const json = (await response.json().catch(() => ({}))) as {
        saved?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(json.error ?? "Could not update wishlist");
      setSaved(Boolean(json.saved));
      toast({
        tone: "success",
        title: json.saved ? "Saved to wishlist" : "Removed from wishlist",
      });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Wishlist unavailable",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-bg-elevated/90 text-fg transition hover:border-brand hover:text-brand disabled:opacity-60",
        withLabel ? "h-11 px-4 text-sm font-semibold" : "size-9",
        saved && "border-brand text-brand",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-brand")} aria-hidden />
      {withLabel ? (saved ? "Saved" : "Save") : null}
    </button>
  );
}
