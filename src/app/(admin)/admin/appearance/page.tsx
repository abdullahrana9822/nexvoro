import { getSetting } from "@/lib/settings";
import { AppearancePanel } from "@/components/admin/appearance-panel";
import { FONTS, THEMES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminAppearancePage() {
  const appearance = await getSetting<{
    defaultTheme: string;
    defaultFont: string;
    allowCustomerThemes: boolean;
    brandColor?: string;
    accentColor?: string;
  }>("store.appearance", {
    defaultTheme: "light",
    defaultFont: "outfit",
    allowCustomerThemes: true,
  });

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Theme & fonts</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Nine complete themes and six self-hosted fonts. The default is applied to first-time
        visitors; customers can override it from the header.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <AppearancePanel initial={appearance} />

        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="text-sm font-bold text-fg">Available themes</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <li key={theme.id} className="rounded-lg border border-border p-2">
                  <span className="flex gap-1" aria-hidden>
                    {theme.swatch.map((color) => (
                      <span
                        key={color}
                        className="h-5 flex-1 rounded border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  <p className="mt-1 text-[11px] font-semibold text-fg">{theme.name}</p>
                  <p className="text-[9px] text-fg-subtle">{theme.isDark ? "Dark" : "Light"} mode</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="text-sm font-bold text-fg">Font stack</h2>
            <ul className="mt-2 space-y-1.5">
              {FONTS.map((font) => (
                <li key={font.id} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-fg" style={{ fontFamily: font.stack }}>
                    {font.name}
                  </span>
                  <span className="text-[9px] text-fg-subtle">{font.category}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-relaxed text-fg-subtle">
              Fonts are bundled at build time (@fontsource), so there is no third-party font CDN
              request and no layout shift.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
