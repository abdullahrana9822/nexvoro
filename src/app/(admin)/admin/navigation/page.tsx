import { FOOTER_LINKS, NAV_ITEMS } from "@/lib/constants";
import { getCategoryTree } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminNavigationPage() {
  const categories = await getCategoryTree();

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Navigation</h1>
      <p className="mt-1 text-xs text-fg-muted">
        The mega menu is generated from your live category tree plus the curated entries below.
        Add a category and it appears in the menu automatically — no code change needed.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Primary menu</h2>
          <ul className="mt-3 space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.label} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-fg">{item.label}</span>
                  <code className="font-mono text-[9px] text-fg-subtle">{item.href}</code>
                </div>
                {item.columns?.length ? (
                  <p className="mt-1 text-[10px] text-fg-muted">
                    {item.columns.length} dropdown column
                    {item.columns.length === 1 ? "" : "s"} ·{" "}
                    {item.columns.reduce((sum, column) => sum + column.links.length, 0)} links
                  </p>
                ) : null}
                {item.featured ? (
                  <p className="mt-1 text-[10px] text-brand">
                    Featured card: {item.featured.title}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-bold text-fg">Departments in the menu</h2>
          <ul className="mt-3 space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg">{category.name}</span>
                  <span className="text-[9px] text-fg-subtle">
                    {category.productCount} products
                  </span>
                </div>
                {category.children.length > 0 ? (
                  <p className="text-[10px] text-fg-subtle">
                    {category.children.map((child) => child.name).join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-fg">Footer columns</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                  {group.title}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={link.href} className="truncate text-[11px] text-fg-muted">
                      {link.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-fg-subtle">
            Footer columns are defined in <code className="font-mono">src/lib/constants.ts</code>{" "}
            so they stay in sync with routes that actually exist.
          </p>
        </div>
      </div>
    </div>
  );
}
