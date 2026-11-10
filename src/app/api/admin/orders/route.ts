import { z } from "zod";
import { assertSameOrigin, handleError, readJson, withRole } from "@/lib/api";
import { getOrderById, transitionOrder } from "@/lib/orders";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";
import { orderStatusEnum, paymentStatusEnum } from "@/db/schema";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(orderStatusEnum.enumValues).optional(),
  paymentStatus: z.enum(paymentStatusEnum.enumValues).optional(),
  message: z.string().trim().max(300).optional(),
});

/**
 * Manual admin override. Admins may set any status including DELIVERED —
 * this is the only automated-free path to 100%, and it is fully audited.
 */
export async function PATCH(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const payload = schema.parse(await readJson(request));
      const existing = await getOrderById(payload.orderId);
      if (!existing) return jsonError("Order not found", 404);

      if (payload.status && payload.status !== existing.order.status) {
        await transitionOrder({
          orderId: payload.orderId,
          status: payload.status,
          actorType: "ADMIN",
          actorId: user.id,
          message: payload.message
            ? `Admin override: ${payload.message}`
            : `Status updated by ${user.firstName} (${user.email})`,
          allowDelivered: true,
        });
      }

      if (payload.paymentStatus) {
        await db
          .update(orders)
          .set({ paymentStatus: payload.paymentStatus, updatedAt: new Date() })
          .where(eq(orders.id, payload.orderId));
      }

      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "order.admin_override",
        entity: "order",
        entityId: payload.orderId,
        meta: {
          from: existing.order.status,
          to: payload.status,
          paymentStatus: payload.paymentStatus,
        },
      });

      return jsonOk({ message: "Order updated" });
    });
  } catch (error) {
    return handleError(error);
  }
}
