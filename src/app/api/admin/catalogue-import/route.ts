import {
  assertSameOrigin,
  enforceRateLimit,
  handleError,
  withRole,
} from "@/lib/api";
import { importCatalogueCandidates } from "@/lib/catalogue-import";
import { recordAudit } from "@/lib/activity";
import { jsonOk } from "@/lib/utils";
export async function POST() {
  try {
    const origin = await assertSameOrigin();
    if (origin) return origin;
    const limited = await enforceRateLimit("catalogue-import", 3, 300000);
    if (limited) return limited;
    return withRole("ADMIN", async (user) => {
      const result = await importCatalogueCandidates();
      await recordAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "catalogue.drafts_imported",
        entity: "products",
      });
      return jsonOk(result);
    });
  } catch (error) {
    return handleError(error);
  }
}
