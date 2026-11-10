"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-bg-elevated px-3.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        resetUrl?: string;
      };
      if (!response.ok) throw new Error(json.error ?? "Could not send the reset link");
      setSent(true);
      setMessage(json.message ?? "Check your inbox for the reset link.");
      setResetUrl(json.resetUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-fg">
          <MailCheck className="size-4 text-success" aria-hidden /> Request received
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{message}</p>
        {resetUrl ? (
          <div className="mt-3 rounded-xl border border-border bg-bg-elevated p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-warning">
              Email delivery is not configured on this deployment
            </p>
            <p className="mt-1 text-[11px] text-fg-muted">
              Use this single-use link (valid for one hour). It is only shown outside production:
            </p>
            <Link
              href={resetUrl.replace(/^https?:\/\/[^/]+/, "")}
              className="mt-2 block break-all font-mono text-[10px] text-brand hover:underline"
            >
              {resetUrl.replace(/^https?:\/\/[^/]+/, "")}
            </Link>
          </div>
        ) : null}
        <Link
          href="/login"
          className="mt-4 inline-flex h-10 items-center rounded-full bg-fg px-4 text-xs font-bold text-bg"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="forgot-email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
          Email address
        </label>
        <input
          id="forgot-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Send reset link
      </button>

      <p className="text-center text-[11px] text-fg-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
