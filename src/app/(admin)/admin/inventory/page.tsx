import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { StockCell } from "@/components/admin/inventory-editor";
import { StatCard } from "@/components/admin/stat-card";
import { formatMoney, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.status, "ACTIVE"))
    .orderBy(asc(products.stock))
    .limit(200);

  const [agg] = await db
    .select({
      units: sql<number>`coalesce(sum(${products.stock}), 0)::int`,
      value: sql<string>`coalesce(sum(${products.stock} * ${products.costPrice}), 0)`,
      retail: sql<string>`coalesce(sum(${products.stock} * ${products.price}), 0)`,
      outOfStock: sql<number>`count(*) filter (where ${products.stock} = 0)::int`,
      lowStock: sql<number>`count(*) filter (where ${products.stock} > 0 and ${products.stock} <= ${products.lowStockThreshold})::int`,
    })
    .from(products)
    .where(eq(products.status, "ACTIVE"));

  const retailValue = toNumber(agg?.retail);
  const costValue = toNumber(agg?.value);
  const margin = retailValue > 0 ? ((retailValue - costValue) / retailValue) * 100 : 0;

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Inventory</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Adjust stock inline — changes are saved immediately and audited.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Units on hand" value={agg?.units ?? 0} />
        <StatCard label="Stock at cost" value={formatMoney(costValue)} />
        <StatCard label="Stock at retail" value={formatMoney(retailValue)} />
        <StatCard
          label="Blended gross margin"
          value={`${margin.toFixed(1)}%`}
          hint={`${agg?.outOfStock ?? 0} out of stock · ${agg?.lowStock ?? 0} low`}
          hintTone={(agg?.outOfStock ?? 0) > 0 ? "danger" : "muted"}
        />
      </div>

      <div className="panel mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-xs">
            <thead className="border-b border-border bg-bg-muted/60">
              <tr className="text-[10px] uppercase tracking-wide text-fg-subtle">
                <th className="px-4 py-2.5 font-bold">Product</th>
                <th className="px-4 py-2.5 font-bold">SKU</th>
                <th className="px-4 py-2.5 font-bold">Price</th>
                <th className="px-4 py-2.5 font-bold">Cost</th>
                <th className="px-4 py-2.5 font-bold">Margin</th>
                <th className="px-4 py-2.5 font-bold">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((product) => {
                const price = toNumber(product.price);
                const cost = toNumber(product.costPrice);
                const productMargin =
                  price > 0 && cost > 0 ? ((price - cost) / price) * 100 : null;
                return (
                  <tr key={product.id} className="transition hover:bg-bg-muted/40">
                    <td className="max-w-64 truncate px-4 py-2 font-semibold text-fg">
                      {product.name}
                    </td>
                    <td className="px-4 py-2 font-mono text-[10px] text-fg-subtle">
                      {product.sku}
                    </td>
                    <td className="px-4 py-2 text-fg-muted">{formatMoney(price)}</td>
                    <td className="px-4 py-2 text-fg-subtle">
                      {cost > 0 ? formatMoney(cost) : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {productMargin === null ? (
                        <span className="text-fg-subtle">—</span>
                      ) : (
                        <span
                          className={
                            productMargin < 15 ? "font-semibold text-warning" : "text-success"
                          }
                        >
                          {productMargin.toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <StockCell
                        productId={product.id}
                        stock={product.stock}
                        lowStockThreshold={product.lowStockThreshold}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
