"use client";
import { useState } from "react";
import { UploadCloud, X } from "lucide-react";

export function ImageUploader({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="space-y-3 rounded-xl border border-dashed border-border-strong p-4">
    <label className="flex cursor-pointer items-center gap-3 text-xs font-semibold"><UploadCloud className="size-6 text-brand" aria-hidden /><span>{busy ? "Optimizing and uploading…" : "Upload product photographs"}<span className="mt-1 block font-normal text-fg-muted">Multiple files · up to 8 images · 2 MB per file</span></span><input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy || images.length >= 8} onChange={async event => {
      const files = Array.from(event.target.files ?? []); event.target.value = "";
      if (!files.length) return;
      setBusy(true); setError(""); const next = [...images];
      try {
        for (const file of files.slice(0, 8 - next.length)) {
          if (file.size > 2 * 1024 * 1024) throw new Error(`${file.name}: maximum file size is 2 MB`);
          const form = new FormData(); form.set("file", file);
          const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Upload failed");
          next.push(result.url); onChange([...next]);
        }
      } catch (e) { setError(e instanceof Error ? e.message : "Upload failed"); }
      finally { setBusy(false); }
    }} /></label>
    <ul className="space-y-1">{images.map((url, index) => <li key={`${url}-${index}`} className="flex items-center justify-between gap-2 text-[11px]"><span className="truncate">{index + 1}. {url.split("/").pop()}</span><button disabled={busy} type="button" aria-label={`Remove image ${index + 1}`} onClick={() => onChange(images.filter((_, i) => i !== index))}><X className="size-4" /></button></li>)}</ul>
    {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    <p className="text-[10px] text-fg-muted">Images are resized and re-encoded as WebP on the server. Save the product to publish changes.</p>
  </div>;
}
