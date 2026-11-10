"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_STUDIO,
  customStyle,
  type Customization,
  type StudioConfig,
} from "@/lib/theme-studio";
import { THEMES, type FontId, type ThemeId } from "@/lib/constants";

type ThemeContextValue = {
  studio: StudioConfig;
  previewTheme: (theme: ThemeId) => void;
  cancelPreview: () => void;
  customization?: Customization;
  customize: (value?: Customization, persist?: boolean) => void;
  theme: ThemeId;
  font: FontId;
  setTheme: (theme: ThemeId) => void;
  setFont: (font: FontId) => void;
  resetAppearance: () => void;
  allowCustomerThemes: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ONE_YEAR = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${ONE_YEAR};samesite=lax`;
}

export function ThemeProvider({
  children,
  initialTheme,
  initialFont,
  defaultTheme,
  defaultFont,
  allowCustomerThemes = true,
  studio = DEFAULT_STUDIO,
  initialCustomization,
}: {
  studio?: StudioConfig;
  initialCustomization?: Customization;
  children: ReactNode;
  initialTheme: ThemeId;
  initialFont: FontId;
  defaultTheme: ThemeId;
  defaultFont: FontId;
  allowCustomerThemes?: boolean;
}) {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);
  const [font, setFontState] = useState<FontId>(initialFont);

  const [customization, setCustomization] = useState(initialCustomization);
  const customize = useCallback(
    (value?: Customization, persist = false) => {
      const root = document.documentElement;
      for (const key of Object.keys(
        customStyle({
          primary: "#000000",
          accent: "#000000",
          background: "#ffffff",
          surface: "#ffffff",
          text: "#000000",
          radius: "soft",
          button: "solid",
          font: "inter",
          motion: "subtle",
        }),
      ))
        root.style.removeProperty(key);
      for (const [key, val] of Object.entries(customStyle(value)))
        root.style.setProperty(key, val);
      root.dataset.motion = value?.motion ?? "full";
      root.dataset.button = value?.button ?? "solid";
      applyFont(value?.font ?? font);
      if (persist) {
        setCustomization(value);
        writeCookie("nexvoro_custom", value ? JSON.stringify(value) : "");
      }
    },
    [font],
  );

  /* Preferences live in a first-party cookie so the server can render the
   * correct theme on the very first paint (no flash, no hydration mismatch).
   * Nothing needs reconciling after mount. */

  const setTheme = useCallback(
    (next: ThemeId) => {
      if (!studio.themes.some((t) => t.id === next && t.enabled)) return;
      customize(studio.themes.find((t) => t.id === next)?.tokens, true);
      applyTheme(next);
      setThemeState(next);
      writeCookie("nexvoro_theme", next);
    },
    [studio, customize],
  );

  const setFont = useCallback((next: FontId) => {
    applyFont(next);
    setFontState(next);
    writeCookie("nexvoro_font", next);
  }, []);

  const resetAppearance = useCallback(() => {
    setTheme(defaultTheme);
    setFont(defaultFont);
  }, [setTheme, setFont, defaultTheme, defaultFont]);

  const previewTheme = useCallback(
    (id: ThemeId) => {
      applyTheme(id);
      customize(studio.themes.find((t) => t.id === id)?.tokens);
    },
    [studio, customize],
  );
  const cancelPreview = useCallback(() => {
    applyTheme(theme);
    customize(customization);
    applyFont(customization?.font ?? font);
  }, [theme, font, customization, customize]);

  const value = useMemo(
    () => ({
      studio,
      previewTheme,
      cancelPreview,
      customization,
      customize,
      theme,
      font,
      setTheme,
      setFont,
      resetAppearance,
      allowCustomerThemes,
    }),
    [
      studio,
      previewTheme,
      cancelPreview,
      customization,
      customize,
      theme,
      font,
      setTheme,
      setFont,
      resetAppearance,
      allowCustomerThemes,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  const dark = THEMES.find((option) => option.id === theme)?.isDark;
  if (meta) meta.setAttribute("content", dark ? "#0b0d12" : "#ffffff");
}

function applyFont(font: FontId) {
  document.documentElement.dataset.font = font;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
