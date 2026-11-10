"use client";

import { useEffect, useState } from "react";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

/**
 * Renders after mount, when the browser clock is available.
 *
 * The server has no trustworthy notion of "now" relative to the visitor, and
 * the client renders a value that changes every second. Computing the countdown
 * during SSR therefore produced different text on the server and the client and
 * broke hydration ("the server rendered text didn't match the client").
 *
 * The same markup and the same number of elements are rendered on both sides,
 * so React reconciles instead of regenerating the tree; only the digits change
 * once the first tick runs on the client.
 */
const PLACEHOLDER: Remaining = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  done: false,
};

function diff(targetMs: number, nowMs: number): Remaining {
  const ms = Math.max(0, targetMs - nowMs);
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
    done: ms === 0,
  };
}

/**
 * Ticking countdown. All state updates happen inside timer callbacks (never
 * synchronously during render/effect), so the component stays compiler-safe.
 */
export function Countdown({
  endsAt,
  className,
}: {
  endsAt: string | null;
  className?: string;
}) {
  const targetMs = endsAt ? new Date(endsAt).getTime() : null;
  const [time, setTime] = useState<Remaining>(PLACEHOLDER);

  useEffect(() => {
    if (targetMs === null) return;
    const tick = () => setTime(diff(targetMs, Date.now()));
    // Deferred deliberately: running the first tick synchronously inside the
    // effect mutates text during the commit that hydration is still walking,
    // which turns a harmless clock drift into a hard hydration mismatch.
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [targetMs]);

  if (targetMs === null) {
    return (
      <p className={className}>
        <span className="text-xs font-bold text-warning">While stocks last</span>
      </p>
    );
  }

  const cells = [
    { label: "Days", value: time.days },
    { label: "Hrs", value: time.hours },
    { label: "Min", value: time.minutes },
    { label: "Sec", value: time.seconds },
  ];

  return (
    <div className={className}>
      <div className="flex gap-1.5" role="timer" aria-live="off">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="min-w-11 rounded-lg bg-fg/90 px-2 py-1.5 text-center text-bg"
          >
            {/*
             * suppressHydrationWarning is the documented escape hatch for
             * content that is *legitimately* time-dependent. Even with a
             * placeholder seed, the value is derived from the visitor's clock
             * and a slow hydration can commit a tick before React finishes
             * comparing this text. Suppressing keeps the server text until the
             * next tick, instead of throwing and regenerating the whole tree.
             */}
            <span
              className="block text-sm font-extrabold tabular-nums leading-none"
              suppressHydrationWarning
            >
              {String(cell.value).padStart(2, "0")}
            </span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide opacity-70">
              {cell.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
