import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NEXVORO account to track orders, manage your wishlist and check out faster.",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "CUSTOMER" ? "/account" : "/admin");

  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : undefined;

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-fg">Welcome back</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Sign in to continue where you left off.
      </p>
      <div className="mt-6">
        <LoginForm next={safeNext} />
      </div>
    </div>
  );
}
