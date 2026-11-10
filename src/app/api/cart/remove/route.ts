import { z } from "zod";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { getCartView, removeCartItem } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ itemId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("cart-remove", 90, 60_000);
    if (limited) return limited;

    const payload = schema.parse(await readJson(request));
    const user = await getCurrentUser();

    await removeCartItem(payload.itemId, user?.id ?? null);
    const cart = await getCartView({ userId: user?.id ?? null });
    return jsonOk({ cart });
  } catch (error) {
    return handleError(error);
  }
}
