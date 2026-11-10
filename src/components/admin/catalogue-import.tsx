"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CatalogueImport() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <section className="panel mb-6 p-5">
      <h2 className="text-lg font-semibold">Build your opening collection</h2>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-fg-muted">
        Import 30 named products across ten categories as unpublished drafts.
        Nothing is offered for sale until you verify prices, stock, exact
        specifications and licensed photography. Drafts have zero inventory, no
        fabricated reviews, and clearly identified category illustrations.
        Existing products are never overwritten.
      </p>
      <button
        disabled={busy}
        className="studio-secondary mt-4"
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/admin/catalogue-import", {
              method: "POST",
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error ?? "Import failed");
            setMessage(
              `${data.imported} drafts added; ${data.skipped} already existed. Review and publish individually.`,
            );
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Import failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Importing…" : "Import 30 review drafts"}
      </button>
      <p className="mt-3 text-xs text-fg-muted" role="status">
        {message}
      </p>
    </section>
  );
}
