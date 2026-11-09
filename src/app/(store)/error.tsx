"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/** Storefront-scoped error boundary — keeps header, footer and cart intact. */
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[store] runtime error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-fg">
          We could not load this page
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          The catalogue service may be temporarily unavailable. Your cart is safe — try again in
          a moment.
        </p>
        {error.digest ? (
          <p className="mt-3 inline-block rounded-lg border border-border bg-bg-muted px-3 py-1.5 font-mono text-[11px] text-fg-subtle">
            Reference {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-brand-fg"
          >
            <RotateCcw className="size-4" aria-hidden /> Retry
          </button>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-fg"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
