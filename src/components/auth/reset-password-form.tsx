"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/auth/password-input";
import { passwordStrength } from "@/lib/password-strength";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const strength = passwordStrength(password);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Both passwords must match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not reset the password");
      setDone(true);
      window.setTimeout(() => router.push("/login"), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-fg">
          <CheckCircle2 className="size-4 text-success" aria-hidden /> Password updated
        </p>
        <p className="mt-1.5 text-xs text-fg-muted">
          All other sessions were signed out. Taking you to the sign-in page…
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex h-10 items-center rounded-full bg-brand px-4 text-xs font-bold text-brand-fg"
        >
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
          New password
        </label>
        <PasswordInput
          id="new-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        {password ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${(strength.score + 1) * 20}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-fg-muted">{strength.label}</span>
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
          Confirm password
        </label>
        <PasswordInput
          id="confirm-password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          invalid={Boolean(confirm) && confirm !== password}
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
        Set new password
      </button>
    </form>
  );
}
