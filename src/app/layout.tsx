import type { Metadata, Viewport } from "next";
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
  const theme = isThemeId(cookieTheme) ? cookieTheme : DEFAULT_THEME;
  const font = isFontId(cookieFont) ? cookieFont : DEFAULT_FONT;

  return (
    <html lang="en" data-theme={theme} data-font={font} suppressHydrationWarning>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-fg"
        >
          Skip to content
        </a>
        <ThemeProvider initialTheme={theme} initialFont={font}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
