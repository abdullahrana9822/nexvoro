"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { THEMES, type FontId, type ThemeId } from "@/lib/constants";

type ThemeContextValue = {
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
}: {
  children: ReactNode;
  initialTheme: ThemeId;
  initialFont: FontId;
  defaultTheme: ThemeId;
  defaultFont: FontId;
  allowCustomerThemes?: boolean;
}) {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);
  const [font, setFontState] = useState<FontId>(initialFont);

  /* Preferences live in a first-party cookie so the server can render the
   * correct theme on the very first paint (no flash, no hydration mismatch).
   * Nothing needs reconciling after mount. */

  const setTheme = useCallback((next: ThemeId) => {
    applyTheme(next);
    setThemeState(next);
    writeCookie("nexvoro_theme", next);
  }, []);

  const setFont = useCallback((next: FontId) => {
    applyFont(next);
    setFontState(next);
    writeCookie("nexvoro_font", next);
  }, []);

  const resetAppearance = useCallback(() => {
    setTheme(defaultTheme);
    setFont(defaultFont);
  }, [setTheme, setFont, defaultTheme, defaultFont]);

  const value = useMemo(
    () => ({ theme, font, setTheme, setFont, resetAppearance, allowCustomerThemes }),
    [theme, font, setTheme, setFont, resetAppearance, allowCustomerThemes],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  const dark = THEMES.find(option => option.id === theme)?.isDark;
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
