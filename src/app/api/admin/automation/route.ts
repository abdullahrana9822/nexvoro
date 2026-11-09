import { assertSameOrigin, handleError, withRole } from "@/lib/api";
import { runOrderAutomation } from "@/lib/orders";
import { recordAudit } from "@/lib/activity";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Admin-triggered manual run of the order lifecycle worker. */
export async function POST() {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    return await withRole("ADMIN", async (user) => {
      const summary = await runOrderAutomation();
      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "worker.order_automation_manual",
        entity: "system",
        meta: summary,
      });
      return jsonOk({ summary });
    });
  } catch (error) {
    return handleError(error);
  }
}
