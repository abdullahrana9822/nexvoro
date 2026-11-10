import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
export const metadata = {
  title: "Change your password",
  robots: { index: false, follow: false },
};
export default async function ChangePassword() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-3xl font-semibold">Secure your account.</h1>
      <p className="mb-8 mt-4 text-sm text-fg-muted">
        {user.mustChangePassword
          ? "Your temporary password must be replaced before you can access administrative features."
          : "Set a new password for your account."}
      </p>
      <ChangePasswordForm />
    </div>
  );
}
