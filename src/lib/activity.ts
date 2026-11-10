import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditLogs, notifications } from "@/db/schema";

export type AuditInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
};

export async function recordAudit(input: AuditInput): Promise<void> {
  let ip: string | null = null;
  try {
    const headerList = await headers();
    ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    /* headers() unavailable in workers — that's fine */
  }

  await db.insert(auditLogs).values({
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? null,
    action: input.action.slice(0, 80),
    entity: input.entity?.slice(0, 60) ?? null,
    entityId: input.entityId?.slice(0, 80) ?? null,
    meta: input.meta ?? null,
    ipAddress: ip?.slice(0, 60) ?? null,
  });
}

export async function notifyUser(input: {
  userId: string | null;
  type?: "ORDER" | "SYSTEM" | "PAYMENT" | "SECURITY" | "REVIEW" | "DISPUTE";
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  if (!input.userId) return;
  await db.insert(notifications).values({
    userId: input.userId,
    type: input.type ?? "SYSTEM",
    title: input.title.slice(0, 200),
    body: input.body ?? null,
    link: input.link?.slice(0, 300) ?? null,
  });
}

/** Fans out a notification to every admin account (used for disputes). */
export async function notifyAdmins(input: {
  title: string;
  body?: string;
  link?: string;
  type?: "ORDER" | "SYSTEM" | "PAYMENT" | "SECURITY" | "REVIEW" | "DISPUTE";
}): Promise<void> {
  const { users } = await import("@/db/schema");
  const { inArray } = await import("drizzle-orm");
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.role, ["ADMIN", "SUPER_ADMIN"]));

  if (admins.length === 0) return;

  await db.insert(notifications).values(
    admins.map((admin) => ({
      userId: admin.id,
      type: input.type ?? "SYSTEM",
      title: input.title.slice(0, 200),
      body: input.body ?? null,
      link: input.link?.slice(0, 300) ?? null,
    })),
  );
}
