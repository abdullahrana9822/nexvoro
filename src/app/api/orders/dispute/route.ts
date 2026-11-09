import { z } from "zod";
import { assertSameOrigin, enforceRateLimit, handleError, readJson, withUser } from "@/lib/api";
import { disputeDelivery } from "@/lib/orders";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().trim().min(5, "Please describe what happened").max(500),
});

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("order-dispute", 10, 60_000);
    if (limited) return limited;

    return await withUser(async (user) => {
      const payload = schema.parse(await readJson(request));
      await disputeDelivery({
        orderId: payload.orderId,
        userId: user.id,
        reason: payload.reason,
      });
      return jsonOk({
        message: "Thanks — our team has been alerted and will contact you shortly.",
      });
    });
  } catch (error) {
    return handleError(error);
  }
}
