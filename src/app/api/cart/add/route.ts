import { cartAddSchema } from "@/lib/validation";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { addToCart, getCartView } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("cart-add", 60, 60_000);
    if (limited) return limited;

    const payload = cartAddSchema.parse(await readJson(request));
    const user = await getCurrentUser();

    await addToCart({ ...payload, userId: user?.id ?? null });
    const cart = await getCartView({ userId: user?.id ?? null });

    return jsonOk({ cart });
  } catch (error) {
    return handleError(error);
  }
}
