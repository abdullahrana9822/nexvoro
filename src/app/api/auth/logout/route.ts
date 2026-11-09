import { assertSameOrigin, handleError } from "@/lib/api";
import { destroyCurrentSession, getCurrentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/activity";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const user = await getCurrentUser();
    await destroyCurrentSession();
    if (user) {
      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "auth.logout",
        entity: "user",
        entityId: user.id,
      });
    }
    return jsonOk({});
  } catch (error) {
    return handleError(error);
  }
}
