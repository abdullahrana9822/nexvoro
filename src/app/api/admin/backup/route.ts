import { sql } from "drizzle-orm";
import { db } from "@/db";
import { handleError, withRole } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TABLES = [
  "users",
  "categories",
  "brands",
  "products",
  "product_variants",
  "shipping_plans",
  "coupons",
  "orders",
  "order_items",
  "order_events",
  "payments",
  "reviews",
  "settings",
  "newsletter_subscribers",
] as const;

/**
 * Creates a logical (JSON) backup of catalogue and order data.
 *
 * Passwords and session tokens are never exported. For full physical backups
 * use your managed Postgres provider's point-in-time recovery — see README.
 */
export async function GET() {
  try {
    return await withRole("SUPER_ADMIN", async (user) => {
      const payload: Record<string, unknown[]> = {};

      for (const table of TABLES) {
        const isSensitive = table === "users";
        const rows = await db.execute(
          isSensitive
            ? sql`select id, email, first_name, last_name, role, is_active, created_at from users order by created_at`
            : sql.raw(`select * from ${table} limit 5000`),
        );
        payload[table] = rows.rows as unknown[];
      }

      const body = {
        meta: {
          generatedAt: new Date().toISOString(),
          generator: "NEXVORO admin backup",
          tables: Object.keys(payload).length,
          note: "Logical JSON export. Passwords and sessions are excluded.",
        },
        data: payload,
      };

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "backup.exported",
        entity: "system",
        meta: { tables: Object.keys(payload).length },
      });

      return new Response(JSON.stringify(body, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="nexvoro-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json"`,
          "Cache-Control": "no-store",
        },
      });
    });
  } catch (error) {
    return handleError(error);
  }
}

/** Connection + integrity diagnostics surfaced in the admin database panel. */
export async function POST() {
  try {
    return await withRole("ADMIN", async () => {
      const version = await db.execute(sql`select version() as version, now() as now`);
      const counts = await db.execute(sql`
        select
          (select count(*) from products)::int as products,
          (select count(*) from categories)::int as categories,
          (select count(*) from orders)::int as orders,
          (select count(*) from users)::int as users,
          (select count(*) from reviews)::int as reviews
      `);
      return jsonOk({
        connection: "ok",
        version: (version.rows[0] as { version?: string })?.version ?? "unknown",
        serverTime: (version.rows[0] as { now?: string })?.now ?? null,
        counts: counts.rows[0] ?? {},
      });
    });
  } catch (error) {
    return handleError(error);
  }
}
