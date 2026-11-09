import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validation";
import { createPasswordReset } from "@/lib/password-reset";
import { recordAudit } from "@/lib/activity";
import { jsonOk } from "@/lib/utils";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Requests a password reset link.
 *
 * The response is deliberately identical whether or not the account exists, so
 * the endpoint cannot be used to enumerate registered emails.
 */
export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("forgot-password", 5, 15 * 60_000);
    if (limited) return limited;

    const { email } = forgotPasswordSchema.parse(await readJson(request));
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const { resetUrl } = await createPasswordReset(email, ip);

    if (resetUrl) {
      await recordAudit({
        action: "auth.password_reset_requested",
        entity: "user",
        meta: { email, ip },
      });
    }

    const message =
      "If that email is registered, a reset link is on its way. It expires in one hour.";

    // Email delivery is not configured, so expose the link only outside
    // production and only to the person who triggered the request.
    const showLink = Boolean(resetUrl) && !env.isProduction && !env.EMAIL_SERVICE_KEY;

    return jsonOk({
      message,
      ...(showLink ? { resetUrl, deliveryConfigured: false } : {}),
    });
  } catch (error) {
    return handleError(error);
  }
}
