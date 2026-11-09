"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export function ProductRowActions({ id, slug }: { id: string; slug: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function archive() {
    if (!window.confirm("Archive this product? It will be hidden from the storefront.")) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not archive product");
      toast({ tone: "success", title: "Product archived" });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Archive failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/products/${id}`}
        className="grid size-7 place-items-center rounded-md text-fg-muted transition hover:bg-bg-muted hover:text-brand"
        aria-label="Edit product"
      >
        <Pencil className="size-3.5" aria-hidden />
      </Link>
      <Link
        href={`/product/${slug}`}
        target="_blank"
        className="grid size-7 place-items-center rounded-md text-fg-muted transition hover:bg-bg-muted hover:text-brand"
        aria-label="View on storefront"
      >
        <ExternalLink className="size-3.5" aria-hidden />
      </Link>
      <button
        type="button"
        onClick={archive}
        disabled={loading}
        className="grid size-7 place-items-center rounded-md text-fg-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        aria-label="Archive product"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
