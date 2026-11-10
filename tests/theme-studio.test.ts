import { describe, it, expect } from "vitest";
import {
  DEFAULT_STUDIO,
  studioSchema,
  customizationSchema,
  contrast,
  readCustomization,
  customStyle,
  enabledTheme,
} from "@/lib/theme-studio";
const tokens = {
  primary: "#a78bfa",
  accent: "#67e8f9",
  background: "#101018",
  surface: "#1d1d29",
  text: "#f5f5fa",
  radius: "soft",
  button: "solid",
  font: "outfit",
  motion: "subtle",
};
describe("Theme Studio configuration", () => {
  it("provides all flagship identities and an enabled featured theme", () => {
    expect(studioSchema.safeParse(DEFAULT_STUDIO).success).toBe(true);
    for (const id of ["dark", "minimal", "glass", "titanium", "futuristic"])
      expect(DEFAULT_STUDIO.themes.some((t) => t.id === id)).toBe(true);
  });
  it("rejects disabled featured themes, duplicate IDs and empty collections", () => {
    expect(
      studioSchema.safeParse({ ...DEFAULT_STUDIO, themes: [] }).success,
    ).toBe(false);
    expect(
      studioSchema.safeParse({
        ...DEFAULT_STUDIO,
        themes: [DEFAULT_STUDIO.themes[0], DEFAULT_STUDIO.themes[0]],
      }).success,
    ).toBe(false);
    expect(
      studioSchema.safeParse({
        ...DEFAULT_STUDIO,
        themes: DEFAULT_STUDIO.themes.map((t) => ({ ...t, enabled: false })),
      }).success,
    ).toBe(false);
  });
  it("supports only enabled themes", () => {
    expect(
      enabledTheme(
        {
          ...DEFAULT_STUDIO,
          themes: DEFAULT_STUDIO.themes.map((t) => ({ ...t, enabled: false })),
        },
        "dark",
      ),
    ).toBe(false);
  });
  it("requires WCAG AA text contrast for both surfaces", () => {
    expect(contrast("#000000", "#ffffff")).toBe(21);
    expect(customizationSchema.safeParse(tokens).success).toBe(true);
    expect(
      customizationSchema.safeParse({ ...tokens, text: "#202020" }).success,
    ).toBe(false);
    expect(
      customizationSchema.safeParse({ ...tokens, surface: tokens.text })
        .success,
    ).toBe(false);
  });
  it("ignores malformed cookies and injection attempts", () => {
    expect(readCustomization("{")).toBeUndefined();
    expect(
      readCustomization(JSON.stringify({ ...tokens, background: "url(evil)" })),
    ).toBeUndefined();
    expect(readCustomization(JSON.stringify(tokens))?.font).toBe("outfit");
  });
  it("derives centralized CSS variables and accessible button foreground", () => {
    const parsed = customizationSchema.parse(tokens);
    expect(customStyle(parsed)["--theme-bg"]).toBe(tokens.background);
    expect(customStyle(parsed)["--theme-brand-fg"]).toBe("#111111");
    expect(customStyle()).toEqual({});
  });
});
