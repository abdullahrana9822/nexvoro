import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { newsletterSchema } from "@/lib/validation";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("newsletter", 5, 10 * 60_000);
    if (limited) return limited;

    const payload = newsletterSchema.parse(await readJson(request));
    await db
      .insert(newsletterSubscribers)
      .values({ email: payload.email, emailNormalized: payload.email })
      .onConflictDoUpdate({
        target: newsletterSubscribers.emailNormalized,
        set: { isActive: true },
      });

    return jsonOk({ message: "You're on the list. Watch your inbox for drops." }, 201);
  } catch (error) {
    return handleError(error);
  }
}
