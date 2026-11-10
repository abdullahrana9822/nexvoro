import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = 14,
  showValue = false,
  className,
}: {
  value: string | number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  if (count === 0) return <span className={cn("text-xs text-fg-subtle", className)}>No reviews yet</span>;
  const rating = Number(value) || 0;
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.35;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Rated ${rating.toFixed(1)} out of 5`}
      >
        {[0, 1, 2, 3, 4].map((index) => {
          const filled = index < full;
          const half = !filled && index === full && hasHalf;
          return (
            <Star
              key={index}
              width={size}
              height={size}
              aria-hidden
              className={cn(
                filled || half ? "text-warning" : "text-border-strong",
                filled ? "fill-warning" : half ? "fill-warning/40" : "fill-none",
              )}
              strokeWidth={1.6}
            />
          );
        })}
      </div>
      {showValue ? (
        <span className="text-xs font-semibold text-fg">{rating.toFixed(1)}</span>
      ) : null}
      {typeof count === "number" ? (
        <span className="text-xs text-fg-subtle">
          ({count})
        </span>
      ) : null}
    </div>
  );
}
