import Link from "next/link";

export type LegalSection = { heading: string; paragraphs: string[]; bullets?: string[] };

export function LegalPage({
  title,
  description,
  updatedAt,
  sections,
  children,
}: {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-fg">{title}</span>
      </nav>

      <div className="mt-3 max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-fg sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{description}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
          Last updated {updatedAt}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_16rem]">
        <article className="max-w-3xl space-y-8">
          {sections.map((section) => (
            <section key={section.heading} id={slug(section.heading)}>
              <h2 className="text-lg font-bold text-fg">{section.heading}</h2>
              {section.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-2 text-sm leading-relaxed text-fg-muted"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 space-y-1.5">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2 text-sm leading-relaxed text-fg-muted"
                    >
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          {children}
        </article>

        <aside className="hidden lg:block">
          <nav
            aria-label="On this page"
            className="panel sticky top-24 p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fg-subtle">
              On this page
            </p>
            <ul className="mt-2 space-y-1">
              {sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slug(section.heading)}`}
                    className="block rounded px-1 py-1 text-xs text-fg-muted transition hover:text-brand"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
