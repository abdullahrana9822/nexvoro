import type { NextConfig } from "next";

/**
 * The sandboxed preview serves this app through a proxied host of the form
 * `https://{port}-{sandbox-id}.e2b.app`. That host is a different origin from
 * the dev server, so Next.js blocks its dev-only resources (HMR) and a
 * SAMEORIGIN frame policy blocks the preview iframe outright.
 *
 * Both exceptions are scoped to development. Production keeps the strict
 * headers below, where the app is served from its own origin.
 */
const isDev = process.env.NODE_ENV !== "production";

const DEV_PREVIEW_ORIGINS = ["*.e2b.app", "localhost", "127.0.0.1"];

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Framing: same-origin only in production. In development the app is embedded
  // by the preview host, so framing is limited to self plus that host instead of
  // being dropped altogether.
  isDev
    ? {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'self' https://*.e2b.app",
      }
    : { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // HSTS is only meaningful over HTTPS; sending it from a plain-HTTP dev server
  // can pin localhost in the browser and break subsequent local visits.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  ...(isDev ? { allowedDevOrigins: DEV_PREVIEW_ORIGINS } : {}),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["bcryptjs"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
