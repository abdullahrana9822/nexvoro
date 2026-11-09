import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { checkoutSchema } from "@/lib/validation";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getCartView } from "@/lib/cart";
import { createOrder } from "@/lib/orders";
import { recordAudit } from "@/lib/activity";
import { jsonError, jsonOk } from "@/lib/utils";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = checkoutSchema.extend({
  idempotencyKey: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("checkout", 8, 10 * 60_000);
    if (limited) return limited;

    const payload = bodySchema.parse(await readJson(request));
    const user = await getCurrentUser();

    // Online payment methods require a configured gateway. Rather than faking a
    // payment, we refuse the order and explain what is missing.
    if (payload.paymentMethod !== "COD" && payload.paymentMethod !== "BANK_TRANSFER") {
      if (!env.PAYMENT_GATEWAY_SECRET || !env.PAYMENT_GATEWAY_PROVIDER) {
        return jsonError(
          "Online card payments are not configured yet. Choose cash on delivery or bank transfer, or ask the store owner to add PAYMENT_GATEWAY_PROVIDER and PAYMENT_GATEWAY_SECRET.",
          503,
        );
      }
    }

    const cart = await getCartView({
      userId: user?.id ?? null,
      shippingPlanId: payload.shippingPlanId || null,
    });

    if (!cart.id || cart.lines.length === 0) {
      return jsonError("Your cart is empty", 400);
    }

    for (const line of cart.lines) {
      if (line.quantity > line.stock) {
        return jsonError(
          `Only ${line.stock} left of ${line.name}. Please update your cart.`,
          409,
        );
      }
    }

    const shippingAddress = {
      fullName: payload.fullName,
      phone: payload.phone,
      line1: payload.line1,
      line2: payload.line2 ?? "",
      city: payload.city,
      state: payload.state,
      postalCode: payload.postalCode,
      country: payload.country,
    };

    const order = await createOrder({
      userId: user?.id ?? null,
      email: payload.email,
      phone: payload.phone,
      shippingAddress,
      paymentMethod: payload.paymentMethod,
      shippingPlanId: payload.shippingPlanId || null,
      couponCode: cart.couponCode,
      notes: payload.notes || null,
      cartId: cart.id,
    });

    if (user && payload.saveAddress) {
      const existing = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(addresses)
        .where(eq(addresses.userId, user.id));
      const isFirst = (existing[0]?.count ?? 0) === 0;
      await db.insert(addresses).values({
        userId: user.id,
        label: "Delivery",
        fullName: payload.fullName,
        phone: payload.phone,
        line1: payload.line1,
        line2: payload.line2 || null,
        city: payload.city,
        state: payload.state,
        postalCode: payload.postalCode,
        country: payload.country,
        isDefault: isFirst,
      });
    }

    await recordAudit({
      actorId: user?.id ?? null,
      actorEmail: payload.email,
      action: "order.created",
      entity: "order",
      entityId: order.id,
      meta: { orderNumber: order.orderNumber, total: order.total },
    });

    return jsonOk(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
        },
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
