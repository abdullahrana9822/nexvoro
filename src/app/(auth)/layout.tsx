import Link from "next/link";
import { ArrowLeft, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { SITE } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg">
              <span className="text-sm font-black">N</span>
            </span>
            <span className="text-lg font-black tracking-tight text-fg">
              NEX<span className="text-brand">VORO</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted transition hover:text-brand"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back to store
          </Link>
        </div>

        <main id="main" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>

        <p className="text-center text-[11px] text-fg-subtle">
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </div>

      <aside className="hero-bg relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
            Members get more
          </p>
          <h2 className="mt-3 max-w-sm text-3xl font-black leading-tight text-fg">
            One account for orders, tracking and wishlists.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-fg-muted">
            <li className="flex items-center gap-2.5">
              <Truck className="size-4 shrink-0 text-brand" aria-hidden />
              Live order tracking with delivery confirmation
            </li>
            <li className="flex items-center gap-2.5">
              <Undo2 className="size-4 shrink-0 text-brand" aria-hidden />
              7-day returns managed from your dashboard
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden />
              Secure sessions, hashed passwords, no card data stored
            </li>
          </ul>
        </div>

        <blockquote className="rounded-2xl border border-border bg-bg-elevated/70 p-5 backdrop-blur">
          <p className="text-sm leading-relaxed text-fg">
            “The tracking page told me exactly where my parcel was, and the delivery
            confirmation means nothing gets marked delivered by mistake.”
          </p>
          <footer className="mt-3 text-xs font-semibold text-fg-muted">
            Fatima S. — verified customer
          </footer>
        </blockquote>
      </aside>
    </div>
  );
}
