import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { passwordSchema } from "@/lib/validation";

export const adminSetupSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Enter the 64-character owner setup token"),
  password: passwordSchema.min(20, "Use at least 20 characters").regex(/[^a-zA-Z0-9]/, "Include a symbol"),
});

/** Only a digest is configured in Vercel. Never put the token in a URL. */
export function validAdminSetupToken(
  token: string,
  source: Record<string, string | undefined> = process.env,
  now = Date.now(),
): boolean {
  const digest = source.ADMIN_SETUP_TOKEN_SHA256;
  const expires = Date.parse(source.ADMIN_SETUP_EXPIRES_AT ?? "");
  if (!digest || !/^[a-f0-9]{64}$/.test(digest) || !Number.isFinite(expires) || expires <= now) return false;
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const actual = createHash("sha256").update(token).digest();
  return timingSafeEqual(actual, Buffer.from(digest, "hex"));
}
