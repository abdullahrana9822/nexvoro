import "server-only";
import { optionalEnv } from "@/lib/env";

/**
 * Supabase configuration for Storage and (optionally) Auth.
 *
 * The application talks to PostgreSQL directly through Drizzle — Supabase is
 * the database provider, not the data layer. The service-role key is read here
 * and **never** re-exported to a client bundle: only the public URL and the
 * anon key may ever reach the browser.
 *
 * Storage buckets used by NEXVORO:
 *   product-images      public read, service-role write
 *   category-images     public read, service-role write
 *   brand-logos         public read, service-role write
 *   homepage-banners    public read, service-role write
 *   customer-uploads    private, signed URLs only
 */
export const SUPABASE_BUCKETS = {
  products: "product-images",
  categories: "category-images",
  brands: "brand-logos",
  banners: "homepage-banners",
  customer: "customer-uploads",
} as const;

export type SupabaseBucket = (typeof SUPABASE_BUCKETS)[keyof typeof SUPABASE_BUCKETS];

export function getSupabaseConfig() {
  const url = optionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = optionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    url,
    anonKey,
    serviceRoleKey,
    /** True when Storage uploads can be performed server-side. */
    canWrite: Boolean(url && serviceRoleKey),
    /** True when only public read URLs can be constructed. */
    canRead: Boolean(url),
    storageBase: url ? `${url.replace(/\/$/, "")}/storage/v1/object/public` : null,
  };
}

/**
 * Public URL for an object in a public bucket. Falls back to the local copy so
 * the storefront keeps working before Storage is configured.
 */
export function publicStorageUrl(
  bucket: SupabaseBucket,
  filename: string,
  fallback: string,
): string {
  const { storageBase } = getSupabaseConfig();
  if (!storageBase) return fallback;
  return `${storageBase}/${bucket}/${filename.replace(/^\/+/, "")}`;
}

/** Uploads (or replaces) an object through the Storage REST API. */
export async function uploadToStorage(input: {
  bucket: SupabaseBucket;
  path: string;
  body: ArrayBuffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
}): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) {
    return {
      ok: false,
      error:
        "Supabase Storage is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const endpoint = `${url.replace(/\/$/, "")}/storage/v1/object/${input.bucket}/${input.path}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": input.contentType,
      "x-upsert": input.upsert === false ? "false" : "true",
      "cache-control": "public, max-age=31536000, immutable",
    },
    body: new Blob([new Uint8Array(input.body as ArrayBuffer)], { type: input.contentType }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, error: `Storage upload failed (${response.status}): ${detail.slice(0, 200)}` };
  }

  return { ok: true, path: input.path };
}
