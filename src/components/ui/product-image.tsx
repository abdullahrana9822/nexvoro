"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Product image with a graceful fallback: if a remote/store image fails to
 * load we render a themed gradient placeholder instead of a broken image.
 */
export function ProductImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
  className,
  fill = true,
  width,
  height,
}: {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const isLocal = src?.startsWith("/");

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-brand-soft via-bg-muted to-accent-soft",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <span className="px-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-fg-subtle">
          NEXVORO
        </span>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isLocal}
        onError={() => setFailed(true)}
        className={cn("object-contain", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 600}
      height={height ?? 600}
      sizes={sizes}
      priority={priority}
      unoptimized={isLocal}
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  );
}
