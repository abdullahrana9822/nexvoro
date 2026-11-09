import { asc } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { SettingsJsonEditor } from "@/components/admin/settings-json-editor";
import { DEFAULT_HERO, DEFAULT_SECTIONS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const rows = await db
    .select()
    .from(settings)
    .orderBy(asc(settings.key));

  const hero = rows.find((row) => row.key === "homepage.hero")?.value ?? DEFAULT_HERO;
  const sections =
    rows.find((row) => row.key === "homepage.sections")?.value ?? DEFAULT_SECTIONS;

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Homepage</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Control the hero slides and which sections render. Changes go live within two minutes
        (the page is revalidated).
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <SettingsJsonEditor
          settingKey="homepage.hero"
          group="homepage"
          label="Hero slides"
          description="Array of slides: eyebrow, title, subtitle, ctaLabel, ctaHref, image, tone."
          value={hero}
        />
        <SettingsJsonEditor
          settingKey="homepage.sections"
          group="homepage"
          label="Section visibility"
          description="Toggle id.enabled to show or hide each homepage block."
          value={sections}
        />
      </div>

      <div className="panel mt-4 p-5">
        <h2 className="text-sm font-bold text-fg">Available images</h2>
        <p className="mt-1 text-[11px] text-fg-muted">
          Reference any of these paths in a hero slide, or paste an absolute https URL.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {[
            "laptop-aurora-pro",
            "laptop-zenith-gaming",
            "laptop-nova-air",
            "laptop-titan-creator",
            "phone-pulse-15",
            "phone-pulse-15-pro",
            "phone-edge-fold",
            "audio-orbital-anc",
            "audio-studio-true",
            "audio-sonic-bar",
            "watch-chrono-x",
            "tablet-slate-11",
            "camera-lumen-r7",
            "camera-lumen-action",
            "drone-skylark-4k",
            "monitor-vista-27",
            "monitor-curve-34",
            "keyboard-mech-rgb",
            "home-hub-mini",
            "home-clean-vac",
          ].map((name) => (
            <code
              key={name}
              className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-[9px] text-fg-muted"
            >
              /products/{name}.svg
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
