import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { verifyResetToken } from "@/lib/password-reset";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your NEXVORO account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const user = await getCurrentUser();
  if (user) return <AlreadySignedIn />;

  const userId = token ? await verifyResetToken(token) : null;

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-fg">Choose a new password</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Pick something long and unique. Signing in on other devices will be required again.
      </p>

      <div className="mt-6">
        {token && userId ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
            <p className="text-sm font-bold text-fg">This link is invalid or has expired</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
              Reset links work once and expire after one hour. Request a fresh one to continue.
            </p>
            <Link
              href="/forgot-password"
              className="mt-4 inline-flex h-10 items-center rounded-full bg-brand px-4 text-xs font-bold text-brand-fg"
            >
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function AlreadySignedIn() {
  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-fg">You&apos;re already signed in</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Sign out first if you want to reset the password for a different account.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/account"
          className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-xs font-bold text-brand-fg"
        >
          Go to my account
        </Link>
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-full border border-border px-4 text-xs font-bold text-fg"
        >
          Sign in as someone else
        </Link>
      </div>
    </div>
  );
}
