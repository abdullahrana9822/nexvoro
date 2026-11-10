import { searchSuggestions } from "@/lib/catalog";
import { enforceRateLimit, handleError } from "@/lib/api";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const limited = await enforceRateLimit("search", 60, 60_000);
    if (limited) return limited;

    const url = new URL(request.url);
    const term = (url.searchParams.get("q") ?? "").slice(0, 120);
    const results = await searchSuggestions(term);
    return jsonOk(results);
  } catch (error) {
    return handleError(error);
  }
}
