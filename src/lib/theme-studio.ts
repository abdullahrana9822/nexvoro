import { z } from "zod";
import { THEMES, isFontId, isThemeId, type ThemeId } from "@/lib/constants";
import { onBrandColor } from "@/lib/appearance";
const color = z.string().regex(/^#[\da-fA-F]{6}$/);
export function contrast(a: string, b: string) {
  const lum = (s: string) =>
    [1, 3, 5]
      .map((i) => parseInt(s.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i]!, 0);
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export const customizationSchema = z
  .object({
    primary: color,
    accent: color,
    background: color,
    surface: color,
    text: color,
    radius: z.enum(["sharp", "soft", "round"]),
    button: z.enum(["solid", "outline"]),
    font: z.string().refine(isFontId),
    motion: z.enum(["none", "subtle", "full"]),
  })
  .refine(
    (v) =>
      contrast(v.text, v.background) >= 4.5 &&
      contrast(v.text, v.surface) >= 4.5,
    "Text must meet 4.5:1 contrast against background and surface",
  );
export type Customization = z.infer<typeof customizationSchema>;
export const studioSchema = z
  .object({
    featured: z.string().refine(isThemeId),
    themes: z
      .array(
        z.object({
          id: z.string().refine(isThemeId),
          enabled: z.boolean(),
          name: z.string().trim().min(2).max(40),
          description: z.string().trim().min(8).max(180),
          tokens: customizationSchema.optional(),
        }),
      )
      .min(1)
      .max(9),
  })
  .refine(
    (v) =>
      new Set(v.themes.map((t) => t.id)).size === v.themes.length &&
      v.themes.some((t) => t.id === v.featured && t.enabled),
    "Use unique themes and an enabled featured theme",
  );
export type StudioConfig = z.infer<typeof studioSchema>;
export const DEFAULT_STUDIO: StudioConfig = {
  featured: "dark",
  themes: [
    "dark",
    "minimal",
    "futuristic",
    "glass",
    "titanium",
    "light",
    "frosted",
    "luxury",
    "neon",
  ].map((id) => {
    const t = THEMES.find((t) => t.id === id)!;
    return { ...t, enabled: true };
  }),
};
export function customStyle(c?: Customization): Record<string, string> {
  if (!c) return {};
  return {
    "--theme-brand": c.primary,
    "--theme-brand-fg": onBrandColor(c.primary),
    "--theme-accent": c.accent,
    "--theme-bg": c.background,
    "--theme-bg-elevated": c.surface,
    "--theme-bg-muted": c.surface,
    "--theme-surface": c.surface,
    "--theme-surface-strong": c.surface,
    "--theme-fg": c.text,
    "--theme-fg-muted": c.text,
    "--theme-fg-subtle": c.text,
    "--studio-radius": { sharp: "4px", soft: "18px", round: "32px" }[c.radius],
  };
}
export function readCustomization(raw?: string): Customization | undefined {
  try {
    const r = customizationSchema.safeParse(JSON.parse(raw ?? "null"));
    return r.success ? r.data : undefined;
  } catch {
    return undefined;
  }
}
export function enabledTheme(config: StudioConfig, id: ThemeId) {
  return config.themes.some((t) => t.id === id && t.enabled);
}
