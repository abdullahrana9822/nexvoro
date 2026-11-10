"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function AdminSetupForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (fields.get("password") !== fields.get("confirm")) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/admin-setup", { method: "POST",
        headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ token: fields.get("token"), password: fields.get("password") }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || result.message || "Setup failed. Check the owner token and password requirements."); return; }
      form.reset(); setDone(true);
    } catch { setError("Could not contact the server. Try again."); }
    finally { setBusy(false); }
  }
  if (done) return <div role="status" className="space-y-4"><h1 className="text-2xl font-bold">Super Admin created</h1><p>Your account is stored securely. Sign in as admin@nexvoro.com using the password you just chose.</p><Link className="inline-block rounded-xl bg-brand px-5 py-3 font-semibold text-brand-fg" href="/login?next=/admin">Sign in to the dashboard</Link><p className="text-xs text-fg-muted">Remove the setup digest and expiry variables from Vercel after confirming access.</p></div>;
  return <form onSubmit={submit} className="space-y-5">
    <div><p className="text-xs uppercase tracking-widest text-brand">Owner-only initialization</p><h1 className="mt-2 text-3xl font-bold">Set up your Super Admin</h1><p className="mt-3 text-sm text-fg-muted">Creates admin@nexvoro.com once. Requires the temporary owner token configured through your Vercel account. No default password exists.</p></div>
    <label className="block text-sm font-semibold">Owner setup token<input name="token" type="password" required minLength={64} maxLength={64} autoComplete="off" spellCheck={false} className="mt-2 block w-full rounded-xl border border-border bg-surface p-3" /></label>
    <label className="block text-sm font-semibold">Your new password<input name="password" type="password" required minLength={20} maxLength={128} autoComplete="new-password" className="mt-2 block w-full rounded-xl border border-border bg-surface p-3" /><span className="mt-1 block text-xs font-normal text-fg-muted">20–128 characters, including uppercase, lowercase, number and symbol. Save it in your password manager.</span></label>
    <label className="block text-sm font-semibold">Confirm password<input name="confirm" type="password" required minLength={20} maxLength={128} autoComplete="new-password" className="mt-2 block w-full rounded-xl border border-border bg-surface p-3" /></label>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <button disabled={busy} className="w-full rounded-xl bg-brand p-3 font-bold text-brand-fg disabled:opacity-50">{busy ? "Creating secure account…" : "Create Super Admin"}</button>
    <Link href="/login?next=/admin" className="block text-center text-sm text-fg-muted">Already set up? Sign in</Link>
  </form>;
}
