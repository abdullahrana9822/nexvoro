import { Check, Circle, Package } from "lucide-react";
import { ORDER_STAGES, STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/db/schema";
import { cn, formatDateTime } from "@/lib/utils";

const PIPELINE: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "AWAITING_CONFIRMATION",
  "DELIVERED",
];

export function OrderProgressBar({
  status,
  progress,
  compact = false,
}: {
  status: OrderStatus;
  progress: number;
  compact?: boolean;
}) {
  const currentIndex = PIPELINE.indexOf(status);
  const isTerminal = ["CANCELLED", "RETURNED", "DISPUTED"].includes(status);

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="text-fg">{STATUS_LABELS[status]}</span>
        <span className={cn("tabular-nums", progress === 100 ? "text-success" : "text-brand")}>
          {progress}%
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            isTerminal
              ? status === "DISPUTED"
                ? "bg-danger"
                : "bg-fg-subtle"
              : progress === 100
                ? "bg-success"
                : "bg-brand",
          )}
          style={{ width: `${Math.max(progress, 3)}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Order progress: ${progress}%`}
        />
      </div>

      {!compact ? (
        <ol className="mt-4 space-y-0">
          {ORDER_STAGES.concat([
            {
              status: "DELIVERED" as OrderStatus,
              label: "Delivered",
              progress: 100,
              description: "Confirmed by you.",
              customerMessage: "",
            },
          ]).map((stage, index) => {
            const stageIndex = PIPELINE.indexOf(stage.status);
            const done = currentIndex > stageIndex || status === "DELIVERED";
            const active = currentIndex === stageIndex && status !== "DELIVERED";
            return (
              <li key={stage.status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border-2",
                      done
                        ? "border-success bg-success text-white"
                        : active
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border text-fg-subtle",
                    )}
                  >
                    {done ? (
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    ) : active ? (
                      <Package className="size-3" aria-hidden />
                    ) : (
                      <Circle className="size-2 fill-current" aria-hidden />
                    )}
                  </span>
                  {index < ORDER_STAGES.length ? (
                    <span
                      className={cn(
                        "w-0.5 flex-1",
                        done ? "bg-success/40" : "bg-border",
                      )}
                    />
                  ) : null}
                </div>
                <div className={cn("pb-4", index === ORDER_STAGES.length && "pb-0")}>
                  <p
                    className={cn(
                      "text-xs font-bold",
                      done || active ? "text-fg" : "text-fg-subtle",
                    )}
                  >
                    {stage.label}
                    <span className="ml-1.5 text-[10px] font-medium text-fg-subtle">
                      {stage.progress}%
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-fg-muted">
                    {stage.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

export function OrderTimeline({
  events,
}: {
  events: { id: string; type: string; message: string; createdAt: Date; progress: number | null }[];
}) {
  return (
    <ol className="space-y-3">
      {[...events].reverse().map((event) => (
        <li key={event.id} className="flex gap-3">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-fg">{event.message}</p>
            <p className="text-[10px] text-fg-subtle">
              {formatDateTime(event.createdAt)}
              {event.progress !== null ? ` · ${event.progress}%` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
