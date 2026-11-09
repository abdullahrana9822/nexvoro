"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";
import { PasswordInput } from "@/components/auth/password-input";

type FieldErrors = Record<string, string>;

function useSubmit(path: string) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(payload: unknown, redirectTo: string) {
    setLoading(true);
    setErrors({});
    setFormError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: FieldErrors;
        redirectTo?: string;
      };
      if (!response.ok) {
        if (json.fields) setErrors(json.fields);
        setFormError(json.error ?? "Something went wrong");
        return;
      }
      toast({ tone: "success", title: "Welcome to NEXVORO" });
      router.push(json.redirectTo ?? redirectTo);
      router.refresh();
    } catch {
      setFormError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, errors, formError };
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-bg-elevated px-3.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

const labelClass = "mb-1.5 block text-xs font-semibold text-fg-muted";

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { submit, loading, errors, formError } = useSubmit("/api/auth/login");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit({ email, password, redirectTo: next }, next ?? "/account");
      }}
      className="space-y-4"
      noValidate
    >
      {formError ? (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">
          {formError}
        </div>
      ) : null}

      <div>
        <label htmlFor="login-email" className={labelClass}>
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email) || undefined}
          className={inputClass}
          placeholder="you@example.com"
        />
        <ErrorText message={errors.email} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <Link href="/forgot-password" className="mb-1.5 text-[11px] font-semibold text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          invalid={Boolean(errors.password)}
        />
        <ErrorText message={errors.password} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Sign in
      </button>

      <p className="text-center text-xs text-fg-muted">
        New to NEXVORO?{" "}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    marketingOptIn: true,
  });
  const { submit, loading, errors, formError } = useSubmit("/api/auth/register");

  const strength = (() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 10) score += 1;
    if (p.length >= 14) score += 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score += 1;
    return Math.min(4, score);
  })();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(form, "/account");
      }}
      className="space-y-4"
      noValidate
    >
      {formError ? (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-first" className={labelClass}>
            First name
          </label>
          <input
            id="reg-first"
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            aria-invalid={Boolean(errors.firstName) || undefined}
            className={inputClass}
          />
          <ErrorText message={errors.firstName} />
        </div>
        <div>
          <label htmlFor="reg-last" className={labelClass}>
            Last name
          </label>
          <input
            id="reg-last"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            className={inputClass}
          />
          <ErrorText message={errors.lastName} />
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" className={labelClass}>
          Email address
        </label>
        <input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          aria-invalid={Boolean(errors.email) || undefined}
          className={inputClass}
          placeholder="you@example.com"
        />
        <ErrorText message={errors.email} />
      </div>

      <div>
        <label htmlFor="reg-phone" className={labelClass}>
          Phone (optional)
        </label>
        <input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          className={inputClass}
          placeholder="+92 300 1234567"
        />
        <ErrorText message={errors.phone} />
      </div>

      <div>
        <label htmlFor="reg-password" className={labelClass}>
          Password
        </label>
        <PasswordInput
          id="reg-password"
          value={form.password}
          onChange={(value) => setForm({ ...form, password: value })}
          autoComplete="new-password"
          invalid={Boolean(errors.password)}
        />
        <div className="mt-1.5 flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition",
                index < strength
                  ? strength <= 2
                    ? "bg-warning"
                    : "bg-success"
                  : "bg-border",
              )}
            />
          ))}
        </div>
        <p className="mt-1 text-[11px] text-fg-subtle">
          At least 10 characters with upper and lower case letters and a number.
        </p>
        <ErrorText message={errors.password} />
      </div>

      <label className="flex items-start gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={form.marketingOptIn}
          onChange={(event) => setForm({ ...form, marketingOptIn: event.target.checked })}
          className="mt-0.5 size-4 rounded border-border accent-[var(--theme-brand)]"
        />
        Email me restocks and launch pricing (optional)
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Create account
      </button>

      <p className="text-center text-[11px] leading-relaxed text-fg-subtle">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline hover:text-brand">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-brand">
          privacy policy
        </Link>
        .
      </p>

      <p className="text-center text-xs text-fg-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          toast({ tone: "info", title: "Signed out" });
          router.push("/");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-xs font-semibold text-fg-muted transition hover:border-danger hover:text-danger",
        className,
      )}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      Sign out
    </button>
  );
}
