import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactSchema } from "@/lib/validation";
import { assertSameOrigin, enforceRateLimit, handleError, readJson } from "@/lib/api";
import { notifyAdmins } from "@/lib/activity";
import { jsonOk } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const originError = await assertSameOrigin();
    if (originError) return originError;

    const limited = await enforceRateLimit("contact", 5, 10 * 60_000);
    if (limited) return limited;

    const payload = contactSchema.parse(await readJson(request));

    await db.insert(contactMessages).values({
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
    });

    await notifyAdmins({
      type: "SYSTEM",
      title: `Contact form: ${payload.subject}`,
      body: `${payload.name} (${payload.email}) sent a new message.`,
      link: "/admin/messages",
    });

    return jsonOk(
      { message: "Message received. Our team usually replies within one business day." },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
