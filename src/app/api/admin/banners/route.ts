import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { assertSameOrigin, handleError, readJson, withRole } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid().optional(),
  slot: z.enum(["homepage", "announcement", "category", "checkout"]).optional(),
  eyebrow: z.string().trim().max(120).optional().or(z.literal("")),
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().trim().max(400).optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaHref: z
    .string()
    .trim()
    .max(400)
    .refine((value) => value === "" || value.startsWith("/") || value.startsWith("https://"), {
      message: "Links must be a site path or an https:// URL",
    })
    .optional()
    .or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  tone: z.enum(["brand", "dark", "accent", "muted"]).optional(),
  position: z.coerce.number().int().min(0).max(99).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().or(z.literal("")),
  endsAt: z.string().datetime().optional().or(z.literal("")),
});

const emptyToNull = (value: string | undefined) => (value && value.length > 0 ? value : null);

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = schema.parse(await readJson(request));
      const [created] = await db
        .insert(banners)
        .values({
          slot: payload.slot ?? "homepage",
          eyebrow: emptyToNull(payload.eyebrow),
          title: payload.title,
          subtitle: emptyToNull(payload.subtitle),
          ctaLabel: emptyToNull(payload.ctaLabel),
          ctaHref: emptyToNull(payload.ctaHref),
          imageUrl: emptyToNull(payload.imageUrl),
          tone: payload.tone ?? "brand",
          position: payload.position ?? 0,
          isActive: payload.isActive ?? true,
          startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
          endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
        })
        .returning();

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "banner.created",
        entity: "banner",
        entityId: created?.id,
        meta: { title: payload.title, slot: payload.slot ?? "homepage" },
      });

      return jsonOk({ banner: created }, 201);
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = schema.extend({ id: z.string().uuid() }).parse(await readJson(request));

      const [updated] = await db
        .update(banners)
        .set({
          ...(payload.slot ? { slot: payload.slot } : {}),
          ...(payload.title ? { title: payload.title } : {}),
          ...(payload.eyebrow !== undefined ? { eyebrow: emptyToNull(payload.eyebrow) } : {}),
          ...(payload.subtitle !== undefined ? { subtitle: emptyToNull(payload.subtitle) } : {}),
          ...(payload.ctaLabel !== undefined ? { ctaLabel: emptyToNull(payload.ctaLabel) } : {}),
          ...(payload.ctaHref !== undefined ? { ctaHref: emptyToNull(payload.ctaHref) } : {}),
          ...(payload.imageUrl !== undefined ? { imageUrl: emptyToNull(payload.imageUrl) } : {}),
          ...(payload.tone ? { tone: payload.tone } : {}),
          ...(payload.position !== undefined ? { position: payload.position } : {}),
          ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
          ...(payload.startsAt !== undefined
            ? { startsAt: payload.startsAt ? new Date(payload.startsAt) : null }
            : {}),
          ...(payload.endsAt !== undefined
            ? { endsAt: payload.endsAt ? new Date(payload.endsAt) : null }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(banners.id, payload.id))
        .returning();

      if (!updated) return jsonError("Banner not found", 404);

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "banner.updated",
        entity: "banner",
        entityId: updated.id,
        meta: { title: updated.title, isActive: updated.isActive },
      });

      return jsonOk({ banner: updated });
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const id = new URL(request.url).searchParams.get("id");
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
        return jsonError("A valid banner id is required", 422);
      }

      const [deleted] = await db
        .delete(banners)
        .where(eq(banners.id, id))
        .returning({ id: banners.id, title: banners.title });

      if (!deleted) return jsonError("Banner not found", 404);

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "banner.deleted",
        entity: "banner",
        entityId: deleted.id,
        meta: { title: deleted.title },
      });

      return jsonOk({ deleted: deleted.id });
    });
  } catch (error) {
    return handleError(error);
  }
}
