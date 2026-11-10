"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export function ReviewModeration({
  reviewId,
  status,
}: {
  reviewId: string;
  status: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function moderate(next: "APPROVED" | "REJECTED" | "PENDING" | "DELETE") {
    setLoading(next);
    try {
      const response =
        next === "DELETE"
          ? await fetch(`/api/admin/reviews?id=${reviewId}`, { method: "DELETE" })
          : await fetch("/api/admin/reviews", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: reviewId, status: next }),
            });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not moderate review");
      toast({
        tone: "success",
        title: next === "DELETE" ? "Review deleted" : `Review ${next.toLowerCase()}`,
      });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Action failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <span
        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
          status === "APPROVED"
            ? "bg-success/10 text-success"
            : status === "PENDING"
              ? "bg-warning/10 text-warning"
              : "bg-bg-muted text-fg-subtle"
        }`}
      >
        {status}
      </span>
      {status !== "APPROVED" ? (
        <button
          type="button"
          onClick={() => void moderate("APPROVED")}
          disabled={loading !== null}
          className="grid size-7 place-items-center rounded-md text-success hover:bg-success/10 disabled:opacity-50"
          aria-label="Approve review"
        >
          {loading === "APPROVED" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3.5" aria-hidden />
          )}
        </button>
      ) : null}
      {status !== "REJECTED" ? (
        <button
          type="button"
          onClick={() => void moderate("REJECTED")}
          disabled={loading !== null}
          className="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-warning/10 hover:text-warning disabled:opacity-50"
          aria-label="Reject review"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Delete this review permanently?")) void moderate("DELETE");
        }}
        disabled={loading !== null}
        className="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        aria-label="Delete review"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
