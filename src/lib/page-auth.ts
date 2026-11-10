import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** Pages redirect guests; API handlers must continue using requireUser (401). */
export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return user;
}
