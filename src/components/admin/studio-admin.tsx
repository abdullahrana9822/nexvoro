"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_STUDIO,
  studioSchema,
  type StudioConfig,
} from "@/lib/theme-studio";
import { SettingsJsonEditor } from "@/components/admin/settings-json-editor";
export function StudioAdmin({ initial }: { initial: StudioConfig }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function save() {
    const parsed = studioSchema.safeParse(form);
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]!.message);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "store.themeStudio",
          group: "appearance",
          value: parsed.data,
        }),
      });
      if (!response.ok) throw new Error("Unable to save theme configuration");
      setMessage(
        "Theme Studio saved. Disabled choices fall back to an enabled theme.",
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="panel mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Theme Studio management</h2>
          <p className="mt-2 text-xs text-fg-muted">
            Control the visitor collection. Only administrators can publish
            global changes.
          </p>
        </div>
        <button
          className="studio-secondary"
          onClick={() => {
            setForm(DEFAULT_STUDIO);
            setMessage(
              "Original settings restored in this draft. Save to publish.",
            );
          }}
        >
          Reset all themes
        </button>
      </div>
      <label className="mt-5 block text-xs">
        Featured experience
        <select
          className="ml-3 rounded-lg border border-border bg-bg p-2"
          value={form.featured}
          onChange={(e) =>
            setForm({
              ...form,
              featured: e.target.value as StudioConfig["featured"],
            })
          }
        >
          {form.themes
            .filter((t) => t.enabled)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
      </label>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {form.themes.map((t, i) => (
          <div key={t.id} className="rounded-xl border border-border p-4">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={t.enabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    themes: form.themes.map((v, n) =>
                      n === i ? { ...v, enabled: e.target.checked } : v,
                    ),
                  })
                }
              />
              Enable {t.id}
            </label>
            <label className="mt-3 block text-xs">
              Name
              <input
                className="mt-1 w-full rounded border border-border bg-bg p-2"
                value={t.name}
                maxLength={40}
                onChange={(e) =>
                  setForm({
                    ...form,
                    themes: form.themes.map((v, n) =>
                      n === i ? { ...v, name: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label className="mt-3 block text-xs">
              Description
              <textarea
                className="mt-1 w-full rounded border border-border bg-bg p-2"
                value={t.description}
                maxLength={180}
                onChange={(e) =>
                  setForm({
                    ...form,
                    themes: form.themes.map((v, n) =>
                      n === i ? { ...v, description: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-4">
        <button disabled={saving} className="studio-primary" onClick={save}>
          {saving ? "Saving…" : "Publish Theme Studio"}
        </button>
        <p className="text-xs text-fg-muted" role="status">
          {message}
        </p>
      </div>
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-semibold">
          Advanced color token & typography configuration
        </summary>
        <p className="my-4 text-xs leading-6 text-fg-muted">
          Optional per-theme tokens: primary, accent, background, surface and
          text (six-digit hex), font
          (outfit/manrope/inter/sora/dmsans/playfair), radius
          (sharp/soft/round), button (solid/outline), motion (none/subtle/full).
          All fields are required when a tokens object is supplied. Text
          contrast must be at least 4.5:1 on background and surface. Refresh
          after publishing here before editing the collection above.
        </p>
        <SettingsJsonEditor
          settingKey="store.themeStudio"
          group="appearance"
          label="Theme Studio tokens"
          description="Advanced validated theme configuration. Changes publish globally."
          value={initial}
        />
      </details>
    </section>
  );
}
