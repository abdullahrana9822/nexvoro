"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

/**
 * Generic JSON settings editor. Each settings row is validated as JSON before
 * it is written, so a malformed value can never reach the storefront.
 */
export function SettingsJsonEditor({
  settingKey,
  group,
  label,
  description,
  value,
}: {
  settingKey: string;
  group: string;
  label: string;
  description: string;
  value: unknown;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON — check for a missing comma or quote.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, group, value: parsed }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not save settings");
      setSavedAt(Date.now());
      toast({ tone: "success", title: `${label} saved` });
      router.refresh();
    } catch (err) {
      toast({
        tone: "error",
        title: "Save failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-fg">{label}</h2>
          <p className="mt-0.5 text-[11px] text-fg-muted">{description}</p>
          <p className="mt-1 font-mono text-[9px] text-fg-subtle">{settingKey}</p>
        </div>
        {savedAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-bold text-success">
            <Check className="size-2.5" aria-hidden /> saved
          </span>
        ) : null}
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={Math.min(18, Math.max(6, text.split("\n").length + 1))}
        spellCheck={false}
        aria-label={`${label} JSON`}
        className="mt-3 w-full rounded-xl border border-border bg-bg-elevated p-3 font-mono text-[11px] leading-relaxed text-fg focus:border-brand focus:outline-none"
      />
      {error ? <p className="mt-1 text-[11px] font-medium text-danger">{error}</p> : null}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-2 inline-flex h-9 items-center gap-2 rounded-full bg-brand px-4 text-[11px] font-bold text-brand-fg disabled:opacity-60"
      >
        {saving ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
        Save
      </button>
    </div>
  );
}
