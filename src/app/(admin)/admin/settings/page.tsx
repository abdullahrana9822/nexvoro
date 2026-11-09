import { asc } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { SettingsJsonEditor } from "@/components/admin/settings-json-editor";
import { env, hasEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const rows = await db.select().from(settings).orderBy(asc(settings.key));

  const integrations = [
    {
      name: "PostgreSQL database",
      ready: hasEnv("DATABASE_URL"),
      detail: "Primary data store. Migrations run with npm run db:deploy.",
    },
    {
      name: "Session signing secret",
      ready: hasEnv("AUTH_SECRET"),
      detail: "Used by the session layer. Rotate to invalidate all sessions.",
    },
    {
      name: "Automated order worker",
      ready: hasEnv("CRON_SECRET"),
      detail: "Vercel Cron calls /api/worker once an hour with this bearer token.",
    },
    {
      name: "Online payments",
      ready: hasEnv("PAYMENT_GATEWAY_PROVIDER", "PAYMENT_GATEWAY_SECRET"),
      detail: "Card and wallet methods stay disabled until a provider is configured.",
    },
    {
      name: "Transactional email",
      ready: hasEnv("EMAIL_SERVICE_KEY"),
      detail: "In-app notifications work today; email delivery needs a service key.",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Store settings</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Operational settings live in the database and are editable here. Secrets live only in
        environment variables — never in this table.
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {rows
          .filter((row) => !row.key.startsWith("homepage."))
          .map((row) => (
            <SettingsJsonEditor
              key={row.key}
              settingKey={row.key}
              group={row.group}
              label={row.key.replace("store.", "").replaceAll(".", " · ")}
              description={`Editable JSON for the ${row.group} configuration group.`}
              value={row.value}
            />
          ))}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-fg">Integration status</h2>
        <p className="mt-1 text-[11px] text-fg-muted">
          Read-only. Configure these in the hosting dashboard (Vercel → Settings → Environment
          Variables).
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {integrations.map((item) => (
            <li key={item.name} className="panel flex items-start gap-3 p-4">
              <span
                className={`mt-1 size-2 shrink-0 rounded-full ${
                  item.ready ? "bg-success" : "bg-warning"
                }`}
                aria-hidden
              />
              <div>
                <p className="text-xs font-bold text-fg">
                  {item.name}{" "}
                  <span
                    className={`ml-1 text-[9px] font-bold uppercase ${
                      item.ready ? "text-success" : "text-warning"
                    }`}
                  >
                    {item.ready ? "configured" : "not configured"}
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-fg-muted">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-[10px] text-fg-subtle">
        Environment: <strong className="text-fg-muted">{env.NODE_ENV}</strong> · App URL:{" "}
        <strong className="text-fg-muted">{env.NEXT_PUBLIC_APP_URL}</strong>
      </p>
    </div>
  );
}
