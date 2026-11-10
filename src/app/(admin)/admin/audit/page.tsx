import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(300);

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Audit log</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Every privileged action is recorded with actor, entity and IP. Showing the latest{" "}
        {rows.length} entries.
      </p>

      <div className="panel mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-170 text-left text-xs">
            <thead className="border-b border-border bg-bg-muted/60">
              <tr className="text-[10px] uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5 font-bold">When</th>
                <th className="px-4 py-2.5 font-bold">Actor</th>
                <th className="px-4 py-2.5 font-bold">Action</th>
                <th className="px-4 py-2.5 font-bold">Entity</th>
                <th className="px-4 py-2.5 font-bold">Meta</th>
                <th className="px-4 py-2.5 font-bold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-fg-subtle">
                    No audit entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-2 text-[10px] text-fg-muted">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="max-w-40 truncate px-4 py-2 text-fg-muted">
                      {row.actorEmail ?? "system"}
                    </td>
                    <td className="px-4 py-2">
                      <code className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-fg">
                        {row.action}
                      </code>
                    </td>
                    <td className="px-4 py-2 text-[10px] text-fg-subtle">
                      {row.entity ? `${row.entity}` : "—"}
                      {row.entityId ? (
                        <span className="ml-1 font-mono text-[9px]">
                          {row.entityId.slice(0, 8)}…
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-64 px-4 py-2">
                      {row.meta ? (
                        <code className="block truncate font-mono text-[9px] text-fg-subtle">
                          {JSON.stringify(row.meta)}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-[9px] text-fg-subtle">
                      {row.ipAddress ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
