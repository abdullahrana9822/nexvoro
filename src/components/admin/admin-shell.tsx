"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ChevronLeft,
  Database,
  FileClock,
  Gauge,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Package,
  Palette,
  Percent,
  ScrollText,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { cn, initials } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  {
    group: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", Icon: Gauge },
      { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
      { href: "/admin/notifications", label: "Notifications", Icon: Bell },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", Icon: Package },
      { href: "/admin/categories", label: "Categories", Icon: LayoutGrid },
      { href: "/admin/inventory", label: "Inventory", Icon: Warehouse },
      { href: "/admin/reviews", label: "Reviews", Icon: Star },
    ],
  },
  {
    group: "Customers & sales",
    items: [
      { href: "/admin/customers", label: "Customers", Icon: Users },
      { href: "/admin/coupons", label: "Coupons", Icon: Percent },
      { href: "/admin/shipping", label: "Shipping", Icon: Truck },
      { href: "/admin/messages", label: "Messages", Icon: Mail },
    ],
  },
  {
    group: "Storefront",
    items: [
      { href: "/admin/appearance", label: "Theme & fonts", Icon: Palette },
      { href: "/admin/homepage", label: "Homepage", Icon: ImageIcon },
      { href: "/admin/blog", label: "Journal", Icon: ImageIcon },
      { href: "/admin/banners", label: "Banners", Icon: ImagePlus },
      { href: "/admin/navigation", label: "Navigation", Icon: ScrollText },
      { href: "/admin/settings", label: "Settings", Icon: Settings },
    ],
  },
  {
    group: "Platform",
    items: [
      { href: "/admin/roles", label: "Roles", Icon: Users },
      { href: "/admin/audit", label: "Audit log", Icon: FileClock },
      { href: "/admin/database", label: "Database", Icon: Database },
      { href: "/admin/backup", label: "Backups", Icon: ScrollText },
    ],
  },
];

export function AdminShell({
  user,
  counts,
  children,
}: {
  user: SessionUser;
  counts: { ordersPending: number; pendingReviews: number; disputed: number };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname && mobileOpen) {
    setLastPath(pathname);
    setMobileOpen(false);
  } else if (lastPath !== pathname) {
    setLastPath(pathname);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-fg">
            <span className="text-xs font-black">N</span>
          </span>
          <span className="text-sm font-black tracking-tight text-fg">
            NEX<span className="text-brand">VORO</span>
          </span>
        </Link>
        <span className="rounded-full bg-bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-fg-subtle">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 thin-scrollbar" aria-label="Admin">
        {NAV.map((section) => (
          <div key={section.group} className="mb-4">
            <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              {section.group}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, Icon }) => {
                const active =
                  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                const badge =
                  href === "/admin/orders" && counts.ordersPending > 0
                    ? counts.ordersPending
                    : href === "/admin/reviews" && counts.pendingReviews > 0
                      ? counts.pendingReviews
                      : href === "/admin/notifications" && counts.disputed > 0
                        ? counts.disputed
                        : null;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
                        active
                          ? "bg-brand text-brand-fg"
                          : "text-fg-muted hover:bg-bg-muted hover:text-fg",
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{label}</span>
                      {badge ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                            active ? "bg-brand-fg/20 text-brand-fg" : "bg-danger/15 text-danger",
                          )}
                        >
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-lg bg-bg-muted p-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-black text-brand-fg">
            {initials(`${user.firstName} ${user.lastName}`)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-fg">{user.firstName}</p>
            <p className="truncate text-[9px] text-fg-subtle">{user.role.replace("_", " ")}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="grid size-7 place-items-center rounded-md text-fg-subtle transition hover:bg-danger/10 hover:text-danger"
              aria-label="Sign out"
            >
              <LogOut className="size-3.5" aria-hidden />
            </button>
          </form>
        </div>
        <Link
          href="/"
          className="mt-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold text-fg-subtle transition hover:text-brand"
        >
          <ArrowLeft className="size-3" aria-hidden /> Back to storefront
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-border bg-bg-elevated lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-bg-elevated">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-3 rounded p-1 text-fg-muted"
              aria-label="Close menu"
            >
              <X className="size-4" aria-hidden />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-56">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-bg-elevated/90 px-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-fg lg:hidden"
            aria-label="Open admin menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <div className="hidden items-center gap-1.5 text-xs font-semibold text-fg-muted sm:flex">
            <Store className="size-3.5" aria-hidden />
            Store administration
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/admin/orders"
              className="relative grid size-9 place-items-center rounded-lg text-fg-muted transition hover:bg-bg-muted hover:text-fg"
              aria-label={`${counts.ordersPending} orders to process`}
            >
              <ShoppingCart className="size-4" aria-hidden />
              {counts.ordersPending > 0 ? (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-danger" />
              ) : null}
            </Link>
            <Link
              href="/admin/notifications"
              className="relative grid size-9 place-items-center rounded-lg text-fg-muted transition hover:bg-bg-muted hover:text-fg"
              aria-label="Notifications"
            >
              <Bell className="size-4" aria-hidden />
              {counts.disputed > 0 ? (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-warning" />
              ) : null}
            </Link>
            <ThemeSwitcher compact />
            <Link
              href="/"
              className="hidden h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-fg-muted transition hover:border-brand hover:text-brand sm:inline-flex"
            >
              <ChevronLeft className="size-3.5" aria-hidden /> Storefront
            </Link>
          </div>
        </header>

        <main id="main" className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-black tracking-tight text-fg">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-fg-muted">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-xs font-bold text-brand-fg"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
