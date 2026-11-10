import { listProducts, toCardProduct } from "@/lib/catalog";
import { productQuerySchema } from "@/lib/validation";
import { enforceRateLimit, handleError } from "@/lib/api";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public catalogue JSON endpoint used by the wishlist + quick view. */
export async function GET(request: Request) {
  try {
    const limited = await enforceRateLimit("products", 120, 60_000);
    if (limited) return limited;

    const url = new URL(request.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const query = productQuerySchema.parse(raw);

    const result = await listProducts({
      ...query,
      deals: query.deals === "true",
      inStock: query.inStock === "true",
    });

    return jsonOk({
      items: result.items.map(toCardProduct),
      total: result.total,
      page: result.page,
      pageCount: result.pageCount,
    });
  } catch (error) {
    return handleError(error);
  }
}
