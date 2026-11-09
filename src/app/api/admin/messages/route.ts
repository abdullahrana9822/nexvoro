import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { assertSameOrigin, handleError, readJson, withRole } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  id: z.string().uuid(),
  isRead: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("STAFF", async () => {
      const { id, isRead } = patchSchema.parse(await readJson(request));
      const [updated] = await db
        .update(contactMessages)
        .set({ isRead })
        .where(eq(contactMessages.id, id))
        .returning({ id: contactMessages.id, isRead: contactMessages.isRead });

      if (!updated) {
        return Response.json({ error: "Message not found" }, { status: 404 });
      }
      return jsonOk({ message: updated });
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
        return Response.json({ error: "A valid message id is required" }, { status: 422 });
      }

      const [deleted] = await db
        .delete(contactMessages)
        .where(eq(contactMessages.id, id))
        .returning({ id: contactMessages.id });

      if (!deleted) {
        return Response.json({ error: "Message not found" }, { status: 404 });
      }

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "contact_message.deleted",
        entity: "contact_message",
        entityId: deleted.id,
      });

      return jsonOk({ deleted: deleted.id });
    });
  } catch (error) {
    return handleError(error);
  }
}
