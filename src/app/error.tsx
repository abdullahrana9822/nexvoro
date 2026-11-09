"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Never surface stack traces to the customer; log server-side only.
    console.error("[ui] runtime error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-black tracking-tight text-fg sm:text-3xl">
        Something broke on our side
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
        This is not your fault. Try the action again — if it keeps happening, contact support and
        quote the reference below.
      </p>
      {error.digest ? (
        <p className="mt-3 rounded-lg border border-border bg-bg-muted px-3 py-1.5 font-mono text-[11px] text-fg-subtle">
          Reference {error.digest}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-brand-fg"
        >
          <RotateCcw className="size-4" aria-hidden /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-fg"
        >
          Back to homepage
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-fg"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}
