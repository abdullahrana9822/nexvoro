import Link from "next/link";
import { ArrowLeft, Compass, PackageSearch, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
        Error 404
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-fg sm:text-5xl">
        This page took a wrong turn
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
        The page you are looking for has moved or never existed. Your cart and account are
        untouched — use one of the routes below to keep going.
      </p>

      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {[
          { href: "/", label: "Homepage", Icon: ArrowLeft },
          { href: "/shop", label: "Shop all", Icon: PackageSearch },
          { href: "/search", label: "Search", Icon: Search },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="panel flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-fg transition hover:border-brand hover:text-brand"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      <p className="mt-8 flex items-center gap-1.5 text-xs text-fg-subtle">
        <Compass className="size-3.5" aria-hidden />
        Need help?{" "}
        <Link href="/contact" className="font-semibold text-brand hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}
