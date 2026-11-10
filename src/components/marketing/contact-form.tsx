"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-bg-elevated px-3.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  if (sent) {
    return (
      <div className="panel flex flex-col items-center p-8 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-bold text-fg">Message sent</p>
        <p className="mt-1 text-xs text-fg-muted">
          Thanks — we usually reply within one business day. Check your spam folder if you do not
          hear from us.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", subject: "", message: "" });
          }}
          className="mt-4 text-xs font-semibold text-brand hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrors({});
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          const json = (await response.json().catch(() => ({}))) as {
            error?: string;
            fields?: Record<string, string>;
          };
          if (!response.ok) {
            if (json.fields) setErrors(json.fields);
            throw new Error(json.error ?? "Could not send message");
          }
          setSent(true);
          toast({ tone: "success", title: "Message sent" });
        } catch (error) {
          toast({
            tone: "error",
            title: "Could not send message",
            description: error instanceof Error ? error.message : undefined,
          });
        } finally {
          setLoading(false);
        }
      }}
      className="panel space-y-3 p-5"
      noValidate
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-name" className="mb-1.5 block text-xs font-semibold text-fg-muted">
            Your name
          </label>
          <input
            id="ct-name"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={inputClass}
            autoComplete="name"
          />
          {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="ct-email" className="mb-1.5 block text-xs font-semibold text-fg-muted">
            Email
          </label>
          <input
            id="ct-email"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className={inputClass}
            autoComplete="email"
          />
          {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="ct-subject" className="mb-1.5 block text-xs font-semibold text-fg-muted">
          Subject
        </label>
        <input
          id="ct-subject"
          required
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
          className={inputClass}
          placeholder="Order NX-2026-10041 — delivery question"
        />
        {errors.subject ? <p className="mt-1 text-xs text-danger">{errors.subject}</p> : null}
      </div>

      <div>
        <label htmlFor="ct-message" className="mb-1.5 block text-xs font-semibold text-fg-muted">
          Message
        </label>
        <textarea
          id="ct-message"
          required
          rows={5}
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          className="w-full rounded-xl border border-border bg-bg-elevated p-3 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          placeholder="Tell us what you need help with…"
        />
        {errors.message ? <p className="mt-1 text-xs text-danger">{errors.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-brand-fg transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        Send message
      </button>
    </form>
  );
}
