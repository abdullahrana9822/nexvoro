import { z } from "zod";
import { assertSameOrigin, enforceRateLimit, handleError, readJson, withUser } from "@/lib/api";
import { confirmDelivery } from "@/lib/orders";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ orderId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("order-confirm", 15, 60_000);
    if (limited) return limited;

    return await withUser(async (user) => {
      const payload = schema.parse(await readJson(request));
      await confirmDelivery({ orderId: payload.orderId, userId: user.id });
      return jsonOk({ message: "Delivery confirmed. Thank you!" });
    });
  } catch (error) {
    return handleError(error);
  }
}
