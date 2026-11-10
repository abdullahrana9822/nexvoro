"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

export function ShippingPlanEditor({ plans }: { plans: { id: string; name: string }[] }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function runWorker() {
    setRunning(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/automation", { method: "POST" });
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        summary?: {
          scanned: number;
          advanced: number;
          escalated: number;
          skipped: number;
        };
      };
      if (!response.ok) throw new Error(json.error ?? "Worker failed");
      const summary = json.summary;
      setResult(
        `Scanned ${summary?.scanned ?? 0} · advanced ${summary?.advanced ?? 0} · escalated ${
          summary?.escalated ?? 0
        } · skipped ${summary?.skipped ?? 0}`,
      );
      toast({ tone: "success", title: "Automation run complete" });
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Automation failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="panel p-5 lg:col-start-2 lg:row-start-1">
      <h2 className="text-sm font-bold text-fg">Run automation now</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
        The same job Vercel Cron calls every hour. Safe to run manually — it never marks an order
        delivered.
      </p>
      <button
        type="button"
        onClick={runWorker}
        disabled={running}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-bold text-brand-fg disabled:opacity-60"
      >
        {running ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <PlayCircle className="size-3.5" aria-hidden />
        )}
        Run order worker
      </button>
      {result ? (
        <p className="mt-2 rounded-lg bg-bg-muted px-3 py-2 text-[10px] font-medium text-fg-muted">
          {result}
        </p>
      ) : null}
      <p className="mt-3 text-[10px] text-fg-subtle">
        {plans.length} active plan{plans.length === 1 ? "" : "s"}:{" "}
        {plans.map((plan) => plan.name).join(", ")}
      </p>
    </div>
  );
}
