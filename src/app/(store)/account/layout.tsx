import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, LayoutDashboard, MapPin, Package, Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/auth-forms";
import { initials } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", Icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", Icon: Package },
  { href: "/account/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  { href: "/track", label: "Track order", Icon: Truck },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-muted/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-sm font-black text-brand-fg">
            {initials(`${user.firstName} ${user.lastName}`)}
          </span>
          <div>
            <p className="text-base font-bold text-fg">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-fg-muted">{user.email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Account" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="no-scrollbar flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {LINKS.map(({ href, label, Icon }) => (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-sm font-semibold text-fg-muted transition hover:border-border hover:bg-bg-elevated hover:text-fg lg:w-full"
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>{children}</div>
      </div>
    </div>
  );
}
