"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setState("error");
        setMessage(json.error ?? "Could not subscribe. Please try again.");
        return;
      }
      setState("done");
      setMessage(json.message ?? "You're subscribed.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
        <Check className="size-4" aria-hidden />
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={cn(
          "flex gap-2",
          compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row",
        )}
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-11 flex-1 rounded-full border border-border bg-bg-elevated px-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <>
              Subscribe <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </button>
      </div>
      {state === "error" ? (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {message}
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-fg-subtle">
          By subscribing you agree to our{" "}
          <a href="/privacy" className="underline hover:text-brand">
            privacy policy
          </a>
          .
        </p>
      )}
    </form>
  );
}
