import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { LoginForm } from "@/components/auth/auth-forms";
export const metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};
export default async function AdminLogin() {
  const user = await getCurrentUser();
  if (user && hasRole(user.role, "STAFF"))
    redirect(user.mustChangePassword ? "/change-password" : "/admin/dashboard");
  return (
    <div className="mx-auto w-full max-w-md px-6 py-16">
      <p className="text-xs tracking-[.2em] text-brand">
        NEXVORO / CONTROL ROOM
      </p>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight">
        Welcome back.
      </h1>
      <p className="mb-8 mt-4 text-sm text-fg-muted">
        Sign in with your administrator username or email. Temporary access
        requires a password change before dashboard access.
      </p>
      <LoginForm next="/admin/dashboard" />
    </div>
  );
}
