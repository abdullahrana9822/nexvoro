"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { FONTS, THEMES, isFontId, isThemeId } from "@/lib/constants";

export function AppearancePanel({
  initial,
}: {
  initial: { defaultTheme: string; defaultFont: string; allowCustomerThemes: boolean; brandColor?: string; accentColor?: string };
}) {
  const [form, setForm] = useState({
    defaultTheme: isThemeId(initial.defaultTheme) ? initial.defaultTheme : "light",
    defaultFont: isFontId(initial.defaultFont) ? initial.defaultFont : "outfit",
    allowCustomerThemes: initial.allowCustomerThemes,
    brandColor: initial.brandColor ?? "",
    accentColor: initial.accentColor ?? "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { setTheme, setFont } = useTheme();

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "store.appearance",
          group: "appearance",
          value: form,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Could not save appearance");
      setTheme(form.defaultTheme);
      setFont(form.defaultFont);
      toast({ tone: "success", title: "Appearance saved" });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Save failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel space-y-4 p-5">
      <div className="grid grid-cols-2 gap-4">
        {(["brandColor", "accentColor"] as const).map(key => <label key={key} className="text-xs font-semibold">{key === "brandColor" ? "Brand color override" : "Accent color override"}<input aria-label={key} placeholder="#8b5cf6" pattern="#[0-9a-fA-F]{6}" maxLength={7} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full rounded-lg border border-border bg-surface p-2" /><span className="mt-1 block text-[10px] text-fg-muted">Leave empty to use each theme’s palette.</span></label>)}
      </div>
      <div>
        <label htmlFor="default-theme" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
          Default theme for new visitors
        </label>
        <select
          id="default-theme"
          value={form.defaultTheme}
          onChange={(event) =>
            setForm({ ...form, defaultTheme: event.target.value as typeof form.defaultTheme })
          }
          className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs font-semibold text-fg focus:border-brand focus:outline-none"
        >
          {THEMES.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="default-font" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
          Default font
        </label>
        <select
          id="default-font"
          value={form.defaultFont}
          onChange={(event) =>
            setForm({ ...form, defaultFont: event.target.value as typeof form.defaultFont })
          }
          className="h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-xs font-semibold text-fg focus:border-brand focus:outline-none"
        >
          {FONTS.map((font) => (
            <option key={font.id} value={font.id}>
              {font.name} — {font.category}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-start gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={form.allowCustomerThemes}
          onChange={(event) =>
            setForm({ ...form, allowCustomerThemes: event.target.checked })
          }
          className="mt-0.5 size-4 rounded border-border accent-[var(--theme-brand)]"
        />
        <span>
          Let customers switch theme and font
          <span className="mt-0.5 block text-[10px] text-fg-subtle">
            Preferences are stored in a first-party cookie for one year.
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand text-xs font-bold text-brand-fg disabled:opacity-60"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
        Save appearance
      </button>
    </div>
  );
}
