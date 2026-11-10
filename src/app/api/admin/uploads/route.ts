import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { assertSameOrigin, enforceRateLimit, withRole } from "@/lib/api";
import { getSupabaseConfig, publicStorageUrl, uploadToStorage } from "@/lib/supabase";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = await assertSameOrigin();
  if (origin) return origin;
  return withRole("ADMIN", async (user) => {
    const limited = await enforceRateLimit("admin-image-upload", 30, 60_000);
    if (limited) return limited;
    if (!getSupabaseConfig().canWrite) return jsonError("Storage uploads require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on this deployment.", 503);
    // Bound the actual stream, not just the caller-supplied Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return jsonError("Choose an image", 422);
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > 3 * 1024 * 1024) { await reader.cancel(); return jsonError("Upload one image at a time, at most 2 MB each.", 413); }
      chunks.push(next.value);
    }
    let form: FormData;
    try { form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData(); }
    catch { return jsonError("Invalid image upload", 422); }
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024) return jsonError("Choose an image no larger than 2 MB", 422);
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) return jsonError("Use JPEG, PNG, WebP or AVIF; SVG is not accepted.", 422);
    let output: Buffer;
    try {
      const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 24_000_000 });
      const meta = await image.metadata();
      if (!meta.format || !["jpeg", "png", "webp", "avif", "heif"].includes(meta.format) || (meta.pages ?? 1) > 1) return jsonError("Use a non-animated photograph", 422);
      output = await image.rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch { return jsonError("The image could not be decoded or exceeds the resolution limit", 422); }
    const path = `${randomUUID()}.webp`;
    const uploaded = await uploadToStorage({ bucket: "product-images", path, body: output, contentType: "image/webp", upsert: false });
    if (!uploaded.ok) return jsonError("Storage rejected the upload. Check the product-images bucket and server service-role configuration.", 502);
    await recordAudit({ actorId: user.id, actorEmail: user.email, action: "product.image_uploaded", entity: "storage", entityId: path });
    return jsonOk({ url: publicStorageUrl("product-images", path, ""), bytes: output.length }, 201);
  });
}
