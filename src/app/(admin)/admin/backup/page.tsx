import { desc, sql } from "drizzle-orm";
import { Database, Download, HardDriveDownload, ShieldAlert } from "lucide-react";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const [exports, sizeRow] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(sql`${auditLogs.action} in ('backup.exported','worker.order_automation','worker.order_automation_manual')`)
      .orderBy(desc(auditLogs.createdAt))
      .limit(15),
    db.execute(sql`
      select
        pg_size_pretty(pg_database_size(current_database())) as total,
        (select count(*) from products)::int as products,
        (select count(*) from orders)::int as orders
    `),
  ]);

  const size = sizeRow.rows[0] as
    | { total?: string; products?: number; orders?: number }
    | undefined;

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Backups</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Logical exports you can download now, plus the recovery strategy for production.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
            Database size
          </p>
          <p className="mt-1 text-lg font-black text-fg">{size?.total ?? "—"}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-fg-subtle">Products</p>
          <p className="mt-1 text-lg font-black text-fg">{size?.products ?? 0}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-fg-subtle">Orders</p>
          <p className="mt-1 text-lg font-black text-fg">{size?.orders ?? 0}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
            <HardDriveDownload className="size-4 text-brand" aria-hidden /> On-demand export
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
            A JSON snapshot of catalogue, orders, customers (no password hashes), settings and
            coupons. Suitable for migration or a quick off-site copy.
          </p>
          <a
            href="/api/admin/backup"
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-brand px-4 text-[11px] font-bold text-brand-fg"
          >
            <Download className="size-3.5" aria-hidden /> Download JSON backup
          </a>
        </div>

        <div className="panel p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
            <ShieldAlert className="size-4 text-warning" aria-hidden /> Production recovery
          </h2>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-fg-muted">
            <li>
              Enable automated daily backups and point-in-time recovery on your managed Postgres
              provider (Neon, Supabase, RDS or Vercel Postgres).
            </li>
            <li>Set a retention window of at least 7 days for production data.</li>
            <li>
              Test a restore into a staging database at least once per quarter — an untested
              backup is not a backup.
            </li>
            <li>
              Never commit dumps to Git. The repository ignores <code>.sql</code> dumps and{" "}
              <code>.env*</code> files.
            </li>
          </ul>
        </div>
      </div>

      <div className="panel mt-4 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <Database className="size-4 text-brand" aria-hidden /> Recent maintenance activity
        </h2>
        <ul className="mt-3 space-y-2">
          {exports.length === 0 ? (
            <li className="text-[11px] text-fg-subtle">No exports or worker runs recorded yet.</li>
          ) : (
            exports.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="min-w-0 truncate text-fg-muted">
                  <code className="font-mono text-[10px] text-fg">{row.action}</code>
                  {row.actorEmail ? ` · ${row.actorEmail}` : ""}
                </span>
                <span className="shrink-0 text-[10px] text-fg-subtle">
                  {formatDateTime(row.createdAt)}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
