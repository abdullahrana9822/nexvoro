import "server-only";
import { headers } from "next/headers";
import { ZodError } from "zod";
import {
  AuthorizationError,
  getCurrentUser,
  hasRole,
  type SessionUser,
} from "@/lib/auth";
import type { UserRole } from "@/db/schema";
import { jsonError } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return headerList.get("x-real-ip") ?? "unknown";
}

/**
 * CSRF defence for state-changing requests.
 *
 * Session cookies are SameSite=Lax (so cross-site POSTs do not carry them),
 * and we additionally verify the Origin header matches the app origin.
 */
export async function assertSameOrigin(): Promise<Response | null> {
  const headerList = await headers();
  const origin = headerList.get("origin");

  // Same-origin fetches from browsers always include Origin for POST/PATCH/DELETE.
  if (!origin) return null;

  const allowed = new Set<string>([env.NEXT_PUBLIC_APP_URL]);
  const host = headerList.get("host");
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);

  if (!allowed.has(origin)) {
    return jsonError("Request origin is not allowed", 403);
  }
  return null;
}

export async function withUser(
  handler: (user: SessionUser) => Promise<Response>,
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Authentication required", 401);
    return await handler(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function withRole(
  minimum: UserRole,
  handler: (user: SessionUser) => Promise<Response>,
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Authentication required", 401);
    if (user.mustChangePassword)
      return jsonError(
        "Change your temporary password before using this resource",
        403,
      );
    if (!hasRole(user.role, minimum)) {
      return jsonError(
        "You do not have permission to perform this action",
        403,
      );
    }
    return await handler(user);
  } catch (error) {
    return handleError(error);
  }
}

export function handleError(error: unknown): Response {
  if (error instanceof ZodError) {
    return jsonError(
      "Please check the highlighted fields",
      422,
      flattenZod(error),
    );
  }
  if (error instanceof AuthorizationError) {
    return jsonError(error.message, error.status);
  }
  if (error && typeof error === "object" && "status" in error) {
    const status = Number((error as { status: unknown }).status);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    if (status >= 400 && status < 600) return jsonError(message, status);
  }
  console.error("[api] unhandled error:", error);
  return jsonError("Something went wrong on our side. Please try again.", 500);
}

export function flattenZod(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Applies a rate limit and returns a 429 response when exceeded. */
export async function enforceRateLimit(
  scope: string,
  limit: number,
  windowMs: number,
): Promise<Response | null> {
  const ip = await getClientIp();
  const result = rateLimit(`${scope}:${ip}`, limit, windowMs);
  if (result.success) return null;

  return Response.json(
    {
      ok: false,
      error: "Too many attempts. Please wait a moment and try again.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AuthorizationError("Invalid request body", 400);
  }
}

export function noStore<T extends Response>(response: T): T {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
