"use client";

import { useEffect, useState } from "react";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

const ZERO: Remaining = { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };

function diff(targetMs: number): Remaining {
  const ms = Math.max(0, targetMs - Date.now());
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
  const [time, setTime] = useState<Remaining>(() =>
    targetMs ? diff(targetMs) : ZERO,
  );

  useEffect(() => {
    if (targetMs === null) return;
    const tick = () => setTime(diff(targetMs));
    const immediate = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(immediate);
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

  if (time.done) {
    return <p className="text-xs font-bold text-danger">Deal ended</p>;
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
            <span className="block text-sm font-extrabold tabular-nums leading-none">
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
