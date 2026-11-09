import { getOrderByNumberForTracking } from "@/lib/orders";
import { enforceRateLimit, handleError } from "@/lib/api";
import { jsonError, jsonOk } from "@/lib/utils";
import { ORDER_STAGES, STATUS_LABELS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limited = await enforceRateLimit("track", 30, 60_000);
    if (limited) return limited;

    const url = new URL(request.url);
    const reference = (url.searchParams.get("order") ?? "").trim().slice(0, 60);
    if (reference.length < 4) {
      return jsonError("Enter your order number or tracking code", 422);
    }

    const result = await getOrderByNumberForTracking(reference);
    if (!result) {
      return jsonError("We could not find an order with that reference", 404);
    }

    const { order, items, events } = result;

    // Only a masked email/phone is returned so tracking cannot be used to
    // enumerate customer contact details.
    const maskEmail = (email: string) => {
      const [name, domain] = email.split("@");
      if (!name || !domain) return "***";
      return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
    };

    return jsonOk({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: STATUS_LABELS[order.status],
        progress: order.progress,
        placedAt: order.placedAt,
        expectedDeliveryAt: order.expectedDeliveryAt,
        deliveredAt: order.deliveredAt,
        trackingCode: order.trackingCode,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        currency: order.currency,
        email: maskEmail(order.email),
        city: order.shippingAddress.city ?? "",
        country: order.shippingAddress.country ?? "",
      },
      items: items.map((item) => ({
        name: item.productName,
        slug: item.productSlug,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        lineTotal: item.lineTotal,
      })),
      events: events.map((event) => ({
        type: event.type,
        message: event.message,
        progress: event.progress,
        createdAt: event.createdAt,
      })),
      stages: ORDER_STAGES.map((stage) => ({
        status: stage.status,
        label: stage.label,
        progress: stage.progress,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
