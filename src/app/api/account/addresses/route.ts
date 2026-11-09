import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { addressSchema } from "@/lib/validation";
import { assertSameOrigin, handleError, readJson, withUser } from "@/lib/api";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return await withUser(async (user) => {
      const rows = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, user.id))
        .orderBy(addresses.createdAt);
      return jsonOk({ addresses: rows });
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withUser(async (user) => {
      const payload = addressSchema.parse(await readJson(request));

      const count = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(addresses)
        .where(eq(addresses.userId, user.id));

      if ((count[0]?.total ?? 0) >= 10) {
        return jsonError("You can save up to 10 addresses", 422);
      }

      const isDefault = (count[0]?.total ?? 0) === 0;

      const inserted = await db
        .insert(addresses)
        .values({
          userId: user.id,
          label: payload.label || "Home",
          fullName: payload.fullName,
          phone: payload.phone,
          line1: payload.line1,
          line2: payload.line2 || null,
          city: payload.city,
          state: payload.state,
          postalCode: payload.postalCode,
          country: payload.country,
          isDefault,
        })
        .returning();

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "address.created",
        entity: "address",
        entityId: inserted[0]?.id,
      });

      return jsonOk({ address: inserted[0] }, 201);
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withUser(async (user) => {
      const id = new URL(request.url).searchParams.get("id");
      if (!id) return jsonError("Address id is required", 422);

      const deleted = await db
        .delete(addresses)
        .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
        .returning({ id: addresses.id });

      if (!deleted[0]) return jsonError("Address not found", 404);
      return jsonOk({ deleted: true });
    });
  } catch (error) {
    return handleError(error);
  }
}
