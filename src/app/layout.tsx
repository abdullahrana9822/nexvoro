import type { Metadata, Viewport } from "next";
import { DEFAULT_STUDIO, studioSchema, readCustomization, customStyle, enabledTheme } from "@/lib/theme-studio";
import { onBrandColor } from "@/lib/appearance";
import type { CSSProperties } from "react";
import { getSetting } from "@/lib/settings";
import { cookies } from "next/headers";
import "@fontsource-variable/outfit";
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/playfair-display";
import "./globals.css";
import { SITE, DEFAULT_THEME, DEFAULT_FONT, isThemeId, isFontId } from "@/lib/constants";
import { env } from "@/lib/env";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: `${SITE.name} — Premium Electronics Store`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "electronics store",
    "buy laptops online",
    "smartphones",
    "audio gear",
    "gaming laptops",
    "NEXVORO",
  ],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — Where Innovation Meets Lifestyle`,
    description: SITE.description,
    url: env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Where Innovation Meets Lifestyle`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Theme/font are rendered server-side from a cookie so the first paint is
  // already themed (no flash of the wrong theme, no hydration mismatch).
  const store = await cookies();
  const cookieTheme = store.get("nexvoro_theme")?.value;
  const cookieFont = store.get("nexvoro_font")?.value;
  const appearance = await getSetting<{ defaultTheme?: string; defaultFont?: string; allowCustomerThemes?: boolean; brandColor?: string; accentColor?: string }>("store.appearance", {});
  const parsedStudio = studioSchema.safeParse(await getSetting("store.themeStudio", DEFAULT_STUDIO));
  const studio = parsedStudio.success ? parsedStudio.data : DEFAULT_STUDIO;
  const defaultTheme = isThemeId(appearance.defaultTheme) ? appearance.defaultTheme : DEFAULT_THEME;
  const defaultFont = isFontId(appearance.defaultFont) ? appearance.defaultFont : DEFAULT_FONT;
  const allowCustomerThemes = appearance.allowCustomerThemes !== false;
  const preferred = allowCustomerThemes && isThemeId(cookieTheme) && enabledTheme(studio, cookieTheme) ? cookieTheme : defaultTheme;
  const theme = enabledTheme(studio, preferred) ? preferred : studio.themes.find(t=>t.enabled)!.id;
  const customization = (allowCustomerThemes ? readCustomization(store.get("nexvoro_custom")?.value) : undefined) ?? studio.themes.find(t=>t.id===theme)?.tokens;
  const font = allowCustomerThemes && isFontId(cookieFont) ? cookieFont : defaultFont;
  const customColors: CSSProperties & Record<string, string> = {};
  if (/^#[0-9a-f]{6}$/i.test(appearance.brandColor ?? "")) { customColors["--theme-brand"] = appearance.brandColor!; customColors["--theme-brand-fg"] = onBrandColor(appearance.brandColor!); }
  if (/^#[0-9a-f]{6}$/i.test(appearance.accentColor ?? "")) customColors["--theme-accent"] = appearance.accentColor!;

  Object.assign(customColors, customStyle(customization));

  return (
    <html lang="en" data-theme={theme} data-font={customization?.font ?? font} data-motion={customization?.motion} data-button={customization?.button} style={customColors} suppressHydrationWarning>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-fg"
        >
          Skip to content
        </a>
        <ThemeProvider studio={studio} initialCustomization={customization} initialTheme={theme} initialFont={font} defaultTheme={defaultTheme} defaultFont={defaultFont} allowCustomerThemes={allowCustomerThemes}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
