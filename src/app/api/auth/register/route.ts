import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers, users } from "@/db/schema";
import { registerSchema } from "@/lib/validation";
import {
  assertSameOrigin,
  enforceRateLimit,
  handleError,
  readJson,
} from "@/lib/api";
import { createSession, hashPassword } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { jsonError, jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("register", 5, 10 * 60_000);
    if (limited) return limited;

    const payload = registerSchema.parse(await readJson(request));

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.emailNormalized, payload.email))
      .limit(1);

    if (existing.length > 0) {
      return jsonError("An account with this email already exists", 409);
    }

    const inserted = await db
      .insert(users)
      .values({
        email: payload.email,
        emailNormalized: payload.email,
        passwordHash: await hashPassword(payload.password),
        firstName: payload.firstName,
        lastName: payload.lastName ?? "",
        phone: payload.phone || null,
        role: "CUSTOMER",
      })
      .returning({ id: users.id, email: users.email, firstName: users.firstName });

    const user = inserted[0];
    if (!user) return jsonError("Could not create your account", 500);

    if (payload.marketingOptIn) {
      await db
        .insert(newsletterSubscribers)
        .values({ email: payload.email, emailNormalized: payload.email })
        .onConflictDoNothing();
    }

    await createSession(user.id);
    await mergeGuestCart(user.id);

    return jsonOk(
      { user: { id: user.id, email: user.email, firstName: user.firstName } },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
