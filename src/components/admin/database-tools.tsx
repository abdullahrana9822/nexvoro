"use client";

import { useState } from "react";
import { Activity, Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

type Diagnostics = {
  connection: string;
  version: string;
  serverTime: string | null;
  counts: Record<string, number>;
};

export function DatabaseTools() {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function test() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/backup", { method: "POST" });
      const json = (await response.json().catch(() => ({}))) as Diagnostics & {
        error?: string;
      };
      if (!response.ok) throw new Error(json.error ?? "Diagnostics failed");
      setDiagnostics(json);
      toast({ tone: "success", title: "Database reachable" });
    } catch (error) {
      toast({
        tone: "error",
        title: "Connection test failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h2 className="text-sm font-bold text-fg">Connection test</h2>
        <p className="mt-1 text-[11px] text-fg-muted">
          Runs a live query against the configured PostgreSQL instance and reports row counts.
        </p>
        <button
          type="button"
          onClick={test}
          disabled={loading}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-brand px-4 text-[11px] font-bold text-brand-fg disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Activity className="size-3.5" aria-hidden />
          )}
          Run diagnostics
        </button>

        {diagnostics ? (
          <dl className="mt-3 space-y-1.5 rounded-lg bg-bg-muted p-3 text-[10px]">
            <div className="flex justify-between gap-3">
              <dt className="text-fg-subtle">Status</dt>
              <dd className="font-bold text-success">{diagnostics.connection}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-fg-subtle">Server time</dt>
              <dd className="font-semibold text-fg">{diagnostics.serverTime ?? "—"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="shrink-0 text-fg-subtle">Version</dt>
              <dd className="truncate font-mono text-fg-muted">{diagnostics.version}</dd>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
              {Object.entries(diagnostics.counts).map(([table, count]) => (
                <span key={table} className="text-fg-muted">
                  {table}: <strong className="text-fg">{count}</strong>
                </span>
              ))}
            </div>
          </dl>
        ) : null}
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-bold text-fg">Logical export</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
          Downloads catalogue, orders and settings as JSON. Passwords and session tokens are
          excluded. For full point-in-time recovery use your database provider&apos;s backups.
        </p>
        <a
          href="/api/admin/backup"
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-[11px] font-bold text-fg transition hover:border-brand hover:text-brand"
        >
          <Download className="size-3.5" aria-hidden /> Download backup
        </a>
      </div>
    </div>
  );
}
