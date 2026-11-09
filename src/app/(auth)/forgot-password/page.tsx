import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a secure, single-use link to reset your NEXVORO account password.",
  robots: { index: false, follow: true },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "CUSTOMER" ? "/account" : "/admin");

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-fg">Reset your password</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Enter the email on your account and we&apos;ll send a single-use link that expires in one
        hour.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-[11px] leading-relaxed text-fg-subtle">
        For your security we always show the same confirmation, whether or not an account exists.
        Need help from a human?{" "}
        <Link href="/contact" className="font-semibold text-brand hover:underline">
          Contact support
        </Link>
        .
      </p>
    </div>
  );
}
