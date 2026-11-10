import type { Metadata } from "next";
import { AdminSetupForm } from "@/components/auth/admin-setup-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Owner setup",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AdminSetupPage() {
  return <AdminSetupForm />;
}
