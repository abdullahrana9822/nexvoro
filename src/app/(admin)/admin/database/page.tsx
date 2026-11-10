import { checkDatabaseConnection } from "@/db";
import { DatabaseTools } from "@/components/admin/database-tools";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  const health = await checkDatabaseConnection();
  const hasUrl = Boolean(process.env.DATABASE_URL);
  const host = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").host.replace(/:[^:]*@/, ":****@");
    } catch {
      return "not configured";
    }
  })();

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Database</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Connection health, migration status and export tools. Credentials are never rendered in
        the browser.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Runtime status</h2>
          <dl className="mt-3 space-y-2 text-[11px]">
            <div className="flex justify-between">
              <dt className="text-fg-subtle">Connection</dt>
              <dd className={health.ok ? "font-bold text-success" : "font-bold text-danger"}>
                {health.ok ? "connected" : "unreachable"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-subtle">Latency</dt>
              <dd className="font-semibold text-fg">{health.latencyMs} ms</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-fg-subtle">Host</dt>
              <dd className="truncate font-mono text-[10px] text-fg-muted">{host}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-subtle">DATABASE_URL present</dt>
              <dd className="font-semibold text-fg">{hasUrl ? "yes" : "no"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-fg-subtle">Environment</dt>
              <dd className="font-semibold text-fg">{env.NODE_ENV}</dd>
            </div>
          </dl>
          {!health.ok && health.error ? (
            <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-2.5 font-mono text-[10px] text-danger">
              {health.error}
            </p>
          ) : null}
        </div>

        <DatabaseTools />
      </div>

      <div className="panel mt-4 p-5">
        <h2 className="text-sm font-bold text-fg">Migrations & operations</h2>
        <ul className="mt-2 space-y-1.5 text-[11px] text-fg-muted">
          <li>
            <code className="font-mono text-fg">npm run db:migrate</code> — apply pending SQL
            migrations locally (idempotent, transactional).
          </li>
          <li>
            <code className="font-mono text-fg">npm run db:deploy</code> — the same runner, used in
            CI/production release steps.
          </li>
          <li>
            <code className="font-mono text-fg">npm run db:seed</code> — reload catalogue and demo
            data (destructive: truncates transactional tables).
          </li>
          <li>
            <code className="font-mono text-fg">npm run db:generate</code> — generate a new
            migration from schema changes.
          </li>
        </ul>
        <p className="mt-3 text-[10px] leading-relaxed text-fg-subtle">
          Rollbacks are performed with a forward migration that reverses the change, keeping the
          history linear and reproducible. Physical backups and point-in-time recovery are handled
          by the managed Postgres provider (Neon, Supabase, RDS) — see README.
        </p>
      </div>
    </div>
  );
}
