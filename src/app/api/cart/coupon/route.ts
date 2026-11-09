import { z } from "zod";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { applyCoupon, getCartView, removeCoupon } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  code: z.string().trim().max(40).optional(),
  action: z.enum(["apply", "remove"]).default("apply"),
});

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("cart-coupon", 20, 60_000);
    if (limited) return limited;

    const payload = schema.parse(await readJson(request));
    const user = await getCurrentUser();

    if (payload.action === "remove") {
      await removeCoupon(user?.id ?? null);
    } else {
      if (!payload.code) return jsonOk({ cart: await getCartView({ userId: user?.id ?? null }) });
      await applyCoupon(payload.code, user?.id ?? null);
    }

    const cart = await getCartView({ userId: user?.id ?? null });
    return jsonOk({ cart });
  } catch (error) {
    return handleError(error);
  }
}
