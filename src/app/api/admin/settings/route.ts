import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { assertSameOrigin, handleError, readJson, withRole } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9._-]+$/i, "Only letters, numbers, dots, dashes"),
  value: z.unknown(),
  group: z.string().trim().max(60).optional(),
});

export async function PUT(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = schema.parse(await readJson(request));

      await db
        .insert(settings)
        .values({
          key: payload.key,
          value: payload.value,
          group: payload.group ?? "general",
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: payload.value, updatedAt: new Date() },
        });

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "settings.updated",
        entity: "settings",
        entityId: payload.key,
      });

      return jsonOk({ key: payload.key });
    });
  } catch (error) {
    return handleError(error);
  }
}
