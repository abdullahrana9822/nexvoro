import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={cn("panel p-5 shadow-soft", className)}>{children}</Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-fg-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-fg transition hover:border-brand hover:text-brand"
        >
          {action.label}
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon ? (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-bold text-fg">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-fg-muted">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-semibold text-brand-fg transition hover:brightness-110"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
