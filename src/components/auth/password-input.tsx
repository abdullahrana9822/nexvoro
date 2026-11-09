"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Password field with a show/hide toggle. Shared by sign-in, sign-up and the
 * password-reset screens so the affordance stays identical everywhere.
 */
export function PasswordInput({
  value,
  onChange,
  id,
  autoComplete,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
  autoComplete: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-3.5 pr-11 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1 top-1 grid size-9 place-items-center rounded-lg text-fg-subtle hover:bg-bg-muted hover:text-fg"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
