import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { assertSameOrigin, handleError, readJson, withRole } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk, slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(60).optional().or(z.literal("")),
  parentId: z.string().uuid().optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = schema.parse(await readJson(request));
      const slug = slugify(payload.slug || payload.name);

      const existing = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);
      if (existing[0]) return jsonError("That slug is already in use", 409);

      const inserted = await db
        .insert(categories)
        .values({
          name: payload.name,
          slug,
          description: payload.description || null,
          imageUrl: payload.imageUrl || null,
          icon: payload.icon || null,
          parentId: payload.parentId || null,
          position: payload.position ?? 0,
          isActive: payload.isActive ?? true,
          isFeatured: payload.isFeatured ?? false,
        })
        .returning();

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "category.created",
        entity: "category",
        entityId: inserted[0]?.id,
        meta: { name: payload.name },
      });

      return jsonOk({ category: inserted[0] }, 201);
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
      const { id, ...rest } = payload;

      if (rest.parentId === id) {
        return jsonError("A category cannot be its own parent", 422);
      }

      const updated = await db
        .update(categories)
        .set({
          name: rest.name,
          slug: rest.slug ? slugify(rest.slug) : undefined,
          description: rest.description === undefined ? undefined : rest.description || null,
          imageUrl: rest.imageUrl === undefined ? undefined : rest.imageUrl || null,
          icon: rest.icon === undefined ? undefined : rest.icon || null,
          parentId: rest.parentId === undefined ? undefined : rest.parentId || null,
          position: rest.position,
          isActive: rest.isActive,
          isFeatured: rest.isFeatured,
        })
        .where(eq(categories.id, id))
        .returning();

      if (!updated[0]) return jsonError("Category not found", 404);

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "category.updated",
        entity: "category",
        entityId: id,
      });

      return jsonOk({ category: updated[0] });
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
      if (!id) return jsonError("Category id is required", 422);

      const updated = await db
        .update(categories)
        .set({ isActive: false })
        .where(eq(categories.id, id))
        .returning({ id: categories.id });

      if (!updated[0]) return jsonError("Category not found", 404);

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "category.disabled",
        entity: "category",
        entityId: id,
      });

      return jsonOk({ disabled: true });
    });
  } catch (error) {
    return handleError(error);
  }
}
