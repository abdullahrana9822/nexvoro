"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/auth/password-input";
export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirm) {
          setError("New passwords must match");
          return;
        }
        setBusy(true);
        setError("");
        try {
          const r = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword: current, password }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "Unable to change password");
          router.replace(data.redirectTo);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Request failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block text-sm">
        Current password
        <PasswordInput
          id="current-password"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
        />
      </label>
      <label className="block text-sm">
        New password
        <PasswordInput
          id="new-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
      </label>
      <label className="block text-sm">
        Confirm new password
        <PasswordInput
          id="confirm-password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
      </label>
      <p className="text-xs text-fg-muted">
        Use at least 14 characters, including uppercase, lowercase and a number.
        All old sessions are revoked when saved.
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button disabled={busy} className="studio-primary w-full">
        {busy ? "Saving securely…" : "Change password & continue"}
      </button>
    </form>
  );
}
