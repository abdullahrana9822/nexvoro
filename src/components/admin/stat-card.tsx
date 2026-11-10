import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  hintTone = "muted",
  href,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  hintTone?: "muted" | "success" | "danger" | "warning";
  href?: string;
  className?: string;
}) {
  const tones = {
    muted: "text-fg-subtle",
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
  } as const;

  const body = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-fg-subtle">{label}</p>
      <p className="mt-1.5 text-xl font-black tracking-tight text-fg">{value}</p>
      {hint ? <p className={cn("mt-0.5 text-[11px] font-medium", tones[hintTone])}>{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "panel block p-4 transition hover:border-brand hover:shadow-soft",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn("panel p-4", className)}>{body}</div>;
}

/** CSS-only bar chart — no charting dependency, no client JS. */
export function RevenueChart({
  data,
}: {
  data: { label: string; revenue: number; count: number }[];
}) {
  const max = Math.max(...data.map((point) => point.revenue), 1);

  return (
    <div>
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Revenue for the last two weeks">
        {data.map((point) => {
          const height = Math.max(2, Math.round((point.revenue / max) * 100));
          return (
            <div key={point.label} className="group relative flex flex-1 flex-col items-center">
              <div className="relative w-full">
                <div
                  className="w-full rounded-t-md bg-brand/25 transition group-hover:bg-brand"
                  style={{ height: `${height * 1.4}px` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-[10px] font-semibold text-bg group-hover:block">
                  {point.revenue.toLocaleString()} · {point.count} orders
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[9px] font-medium text-fg-subtle">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
