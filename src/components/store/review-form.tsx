"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  signedIn,
  canReview,
}: {
  productId: string;
  signedIn: boolean;
  canReview: boolean;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!signedIn) {
    return (
      <div className="panel p-5">
        <p className="text-sm font-semibold text-fg">Bought this product?</p>
        <p className="mt-1 text-xs text-fg-muted">
          Sign in to leave a verified review.{" "}
          <a href="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </a>{" "}
          or{" "}
          <a href="/register" className="font-semibold text-brand hover:underline">
            create an account
          </a>
          .
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="panel p-5">
        <p className="text-sm font-semibold text-success">Thanks for your review!</p>
        <p className="mt-1 text-xs text-fg-muted">
          It will appear on this page once our team approves it.
        </p>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="panel p-5">
        <p className="text-sm font-semibold text-fg">Reviews are verified</p>
        <p className="mt-1 text-xs text-fg-muted">
          Only customers with a delivered order for this product can post a review, so ratings
          stay trustworthy.
        </p>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title,
          body,
          authorName: name || undefined,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not submit your review");
      setDone(true);
      toast({ tone: "success", title: "Review submitted for moderation" });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not submit review",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-3 p-5">
      <p className="text-sm font-semibold text-fg">Write a review</p>

      <fieldset>
        <legend className="sr-only">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
            >
              <Star
                className={cn(
                  "size-6 transition",
                  value <= rating ? "fill-warning text-warning" : "text-border-strong",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </fieldset>

      {!name ? (
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Display name (optional)"
          maxLength={120}
          className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-sm focus:border-brand focus:outline-none"
        />
      ) : null}

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Review title"
        maxLength={160}
        className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-sm focus:border-brand focus:outline-none"
      />

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What did you think? Build quality, performance, battery life…"
        rows={4}
        maxLength={2000}
        className="w-full rounded-xl border border-border bg-bg-elevated p-3 text-sm focus:border-brand focus:outline-none"
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Submit review
      </button>
    </form>
  );
}
