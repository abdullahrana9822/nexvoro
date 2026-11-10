import { getCurrentUser } from "@/lib/auth";
import { handleError } from "@/lib/api";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return jsonOk({ user });
  } catch (error) {
    return handleError(error);
  }
}
