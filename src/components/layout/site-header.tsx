"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { NAV_ITEMS, SITE } from "@/lib/constants";
import { useCart } from "@/components/providers/cart-provider";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { SearchDialog } from "@/components/layout/search-dialog";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  children: { id: string; slug: string; name: string }[];
};

export function SiteHeader({
  user,
  categories,
}: {
  user: SessionUser | null;
  categories: CategoryNode[];
}) {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close transient UI on navigation. Adjusting state during render is the
  // React-recommended alternative to a synchronous setState inside an effect.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setOpenMenu(null);
    setAccountOpen(false);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setOpenMenu(null);
        setAccountOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  const navWithCategories = NAV_ITEMS.map((item) =>
    item.label === "Categories"
      ? {
          ...item,
          columns: [
            {
              title: "All departments",
              links: categories.slice(0, 6).flatMap<{ label: string; href: string; badge?: string }>(
                (category) => [
                  { label: category.name, href: `/shop?category=${category.slug}` },
                  ...category.children.map((child) => ({
                    label: `— ${child.name}`,
                    href: `/shop?category=${child.slug}`,
                  })),
                ],
              ),
            },
            ...(item.columns?.slice(1) ?? []),
          ],
        }
      : item,
  );

  return (
    <>
      <div className="border-b border-border bg-bg-muted/60">
        <div className="container-page flex h-9 items-center justify-between text-[11px] font-medium text-fg-muted">
          <p className="truncate">
            Free delivery on orders over <strong className="font-bold text-fg">PKR 150,000</strong>
            <span className="hidden sm:inline"> · 7-day returns · 12-month warranty</span>
          </p>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/track" className="transition hover:text-brand">
              Track order
            </Link>
            <Link href="/faq" className="transition hover:text-brand">
              Help
            </Link>
            <a href={`tel:${SITE.supportPhone.replace(/\s/g, "")}`} className="transition hover:text-brand">
              {SITE.supportPhone}
            </a>
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,box-shadow] duration-300",
          scrolled
            ? "border-border bg-bg-elevated/85 shadow-soft backdrop-blur-xl"
            : "border-transparent bg-bg-elevated",
        )}
      >
        <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 place-items-center rounded-full text-fg transition hover:bg-bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <Link href="/" className="group flex items-center gap-2" aria-label={`${SITE.name} home`}>
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg shadow-[0_8px_24px_-10px_var(--theme-glow)]">
              <span className="text-sm font-black">N</span>
            </span>
            <span className="text-lg font-black tracking-[-0.03em] text-fg">
              NEX<span className="text-brand">VORO</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {navWithCategories.map((item) => {
              const hasMenu = Boolean(item.columns?.length);
              const active = pathname === item.href;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hasMenu && setOpenMenu(item.label)}
                  onMouseLeave={() => hasMenu && setOpenMenu(null)}
                  onFocusCapture={() => hasMenu && setOpenMenu(item.label)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setOpenMenu(null);
                      event.stopPropagation();
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    aria-expanded={hasMenu ? openMenu === item.label : undefined}
                    aria-haspopup={hasMenu ? "true" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold transition",
                      active ? "text-brand" : "text-fg-muted hover:text-fg",
                    )}
                  >
                    {item.label}
                    {hasMenu ? <ChevronDown className="size-3.5" aria-hidden /> : null}
                  </Link>

                  <AnimatePresence>
                    {hasMenu && openMenu === item.label ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.16 }}
                        className="absolute left-0 top-full z-50 w-[min(56rem,calc(100vw-4rem))] pt-2"
                      >
                        <div className="grid gap-6 rounded-2xl border border-border bg-bg-elevated p-6 shadow-lifted sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
                          {item.columns?.map((column) => (
                            <div key={column.title}>
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                                {column.title}
                              </p>
                              <ul className="space-y-1">
                                {column.links.map((link) => (
                                  <li key={`${column.title}-${link.href}-${link.label}`}>
                                    <Link
                                      href={link.href}
                                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-fg-muted transition hover:bg-bg-muted hover:text-brand"
                                    >
                                      {link.label}
                                      {link.badge ? (
                                        <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">
                                          {link.badge}
                                        </span>
                                      ) : null}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          {item.featured ? (
                            <Link
                              href={item.featured.href}
                              className="group relative overflow-hidden rounded-xl border border-border bg-bg-muted p-4"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
                                Featured
                              </p>
                              <p className="mt-1 text-sm font-bold text-fg">
                                {item.featured.title}
                              </p>
                              <p className="mt-1 text-xs leading-snug text-fg-muted">
                                {item.featured.description}
                              </p>
                              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                                Shop now →
                              </span>
                            </Link>
                          ) : null}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm text-fg-subtle transition hover:border-brand hover:text-brand"
              aria-label="Search products"
            >
              <Search className="size-4" aria-hidden />
              <span className="hidden xl:inline">Search</span>
              <kbd className="hidden rounded border border-border px-1 text-[10px] font-semibold xl:inline">
                ⌘K
              </kbd>
            </button>

            <ThemeSwitcher compact />

            <Link
              href="/account/wishlist"
              className="hidden size-10 place-items-center rounded-full text-fg transition hover:bg-bg-muted sm:grid"
              aria-label="Wishlist"
            >
              <Heart className="size-5" aria-hidden />
            </Link>

            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="grid size-10 place-items-center rounded-full text-fg transition hover:bg-bg-muted"
                aria-label="Account menu"
              >
                <User className="size-5" aria-hidden />
              </button>
              <AnimatePresence>
                {accountOpen ? (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-border bg-bg-elevated p-1.5 shadow-lifted"
                    onMouseLeave={() => setAccountOpen(false)}
                  >
                    {user ? (
                      <>
                        <div className="px-3 py-2">
                          <p className="truncate text-sm font-bold text-fg">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="truncate text-[11px] text-fg-subtle">{user.email}</p>
                        </div>
                        <div className="my-1 h-px bg-border" />
                        <Link
                          href="/account"
                          role="menuitem"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-bg-muted hover:text-fg"
                        >
                          <LayoutDashboard className="size-4" aria-hidden /> Dashboard
                        </Link>
                        <Link
                          href="/account/orders"
                          role="menuitem"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-bg-muted hover:text-fg"
                        >
                          <ShoppingBag className="size-4" aria-hidden /> Orders
                        </Link>
                        {user.role !== "CUSTOMER" ? (
                          <Link
                            href="/admin"
                            role="menuitem"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand-soft"
                          >
                            <LayoutDashboard className="size-4" aria-hidden /> Admin panel
                          </Link>
                        ) : null}
                        <form action="/api/auth/logout" method="post">
                          <button
                            type="submit"
                            role="menuitem"
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-fg-muted transition hover:bg-danger/10 hover:text-danger"
                          >
                            <LogOut className="size-4" aria-hidden /> Sign out
                          </button>
                        </form>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          role="menuitem"
                          className="block rounded-lg px-3 py-2 text-sm font-semibold text-fg transition hover:bg-bg-muted"
                        >
                          Sign in
                        </Link>
                        <Link
                          href="/register"
                          role="menuitem"
                          className="block rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-bg-muted hover:text-fg"
                        >
                          Create an account
                        </Link>
                        <div className="my-1 h-px bg-border" />
                        <Link
                          href="/track"
                          role="menuitem"
                          className="block rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-bg-muted hover:text-fg"
                        >
                          Track an order
                        </Link>
                      </>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={openCart}
              className="relative grid size-10 place-items-center rounded-full text-fg transition hover:bg-bg-muted"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <ShoppingBag className="size-5" aria-hidden />
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-fg">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------- mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-[75] bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              onClickCapture={(event) => {
                if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
              }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-[76] flex w-[86%] max-w-sm flex-col border-r border-border bg-bg-elevated lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <span className="text-lg font-black tracking-tight text-fg">
                  NEX<span className="text-brand">VORO</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-fg-muted hover:bg-bg-muted hover:text-fg"
                  aria-label="Close menu"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 thin-scrollbar">
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-fg transition hover:bg-bg-muted"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
                    Departments
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/shop?category=${category.slug}`}
                          className="block rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-bg-muted hover:text-fg"
                        >
                          {category.name}
                        </Link>
                        {category.children.length > 0 ? (
                          <ul className="ml-3 border-l border-border pl-2">
                            {category.children.map((child) => (
                              <li key={child.id}>
                                <Link
                                  href={`/shop?category=${child.slug}`}
                                  className="block rounded-lg px-3 py-1.5 text-xs text-fg-subtle transition hover:text-brand"
                                >
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-border p-4">
                {user ? (
                  <div className="grid gap-2">
                    <Link
                      href="/account"
                      className="flex h-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg"
                    >
                      My dashboard
                    </Link>
                    {user.role !== "CUSTOMER" ? (
                      <Link
                        href="/admin"
                        className="flex h-11 items-center justify-center rounded-full border border-border text-sm font-semibold text-fg"
                      >
                        Admin panel
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      className="flex h-11 items-center justify-center rounded-full border border-border text-sm font-semibold text-fg"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="flex h-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
