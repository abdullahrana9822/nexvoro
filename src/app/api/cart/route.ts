import { handleError } from "@/lib/api";
import { getCartView } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const planId = new URL(request.url).searchParams.get("plan");
    const cart = await getCartView({
      userId: user?.id ?? null,
      shippingPlanId: planId,
    });
    return jsonOk({ cart });
  } catch (error) {
    return handleError(error);
  }
}
