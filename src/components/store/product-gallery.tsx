"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const gallery = images.length > 0 ? images : [""];
  const [active, setActive] = useState(0);
  const current = gallery[active] ?? gallery[0] ?? "";

  return (
    <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
      {gallery.length > 1 ? (
        <ul className="order-2 flex gap-2 sm:order-1 sm:flex-col">
          {gallery.map((image, index) => (
            <li key={`${image}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View image ${index + 1} of ${gallery.length}`}
                aria-current={index === active}
                className={cn(
                  "relative size-16 overflow-hidden rounded-xl border bg-bg-muted transition sm:size-20",
                  index === active
                    ? "border-brand ring-1 ring-brand"
                    : "border-border hover:border-border-strong",
                )}
              >
                <ProductImage src={image} alt="" sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="order-1 relative aspect-square overflow-hidden rounded-2xl border border-border bg-bg-muted sm:order-2">
        <ProductImage
          src={current}
          alt={name}
          priority
          sizes="(max-width: 1024px) 100vw, 520px"
        />
      </div>
    </div>
  );
}
