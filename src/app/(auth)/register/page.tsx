import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free NEXVORO account for faster checkout, order tracking and wishlists.",
  robots: { index: false, follow: true },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-fg">Create your account</h1>
      <p className="mt-1 text-sm text-fg-muted">
        It takes about 30 seconds and unlocks order tracking and wishlists.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
