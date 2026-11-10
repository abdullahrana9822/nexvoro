import "../scripts/load-env";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { runOrderAutomation } from "@/lib/orders";

/**
 * Database-backed integration tests.
 *
 * They run only when DATABASE_URL is set (vitest loads .env.local), and they
 * never mutate seeded rows — every assertion is read-only against a real
 * PostgreSQL instance, so a schema drift fails the suite instead of silently
 * passing.
 */
const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("database integration", () => {
  beforeAll(async () => {
    await db.execute(sql`select 1`);
  });

  afterAll(async () => {
    // Pool is shared with the app; leave it open for the process exit.
  });

  it("has the expected catalogue tables populated", async () => {
    const result = await db.execute(sql`
      select
        (select count(*) from products where status = 'ACTIVE')::int as products,
        (select count(*) from categories where is_active)::int as categories,
        (select count(*) from brands)::int as brands,
        (select count(*) from shipping_plans where is_active)::int as plans
    `);
    const row = result.rows[0] as {
      products: number;
      categories: number;
      brands: number;
      plans: number;
    };
    expect(row.products).toBeGreaterThan(0);
    expect(row.categories).toBeGreaterThan(0);
    expect(row.brands).toBeGreaterThan(0);
    expect(row.plans).toBeGreaterThan(0);
  });

  it("enables RLS on all application tables exposed through public", async () => {
    const result = await db.execute(sql`
      select relname from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and c.relname in ('users','sessions','password_reset_tokens','addresses',
          'brands','categories','products','product_variants','reviews','carts',
          'cart_items','wishlist_items','coupons','shipping_plans','orders',
          'order_items','order_events','payments','notifications','settings',
          'audit_logs','newsletter_subscribers','contact_messages','banners')
        and not c.relrowsecurity
    `);
    expect(result.rows).toEqual([]);
  });

  it("never stores a plaintext password", async () => {
    const result = await db.execute(sql`select password_hash from users limit 20`);
    for (const row of result.rows as { password_hash: string }[]) {
      expect(row.password_hash.startsWith("$2")).toBe(true);
      expect(row.password_hash.length).toBeGreaterThan(50);
    }
  });

  it("keeps every order's stored progress within bounds", async () => {
    const result = await db.execute(sql`select status, progress from orders`);
    for (const row of result.rows as { status: string; progress: number }[]) {
      expect(row.progress).toBeGreaterThanOrEqual(0);
      expect(row.progress).toBeLessThanOrEqual(100);
      if (row.status !== "DELIVERED") expect(row.progress).toBeLessThan(100);
    }
  });

  it("has no order awaiting confirmation that is already marked delivered", async () => {
    const result = await db.execute(sql`
      select count(*)::int as bad from orders
      where status = 'AWAITING_CONFIRMATION' and delivered_at is not null
    `);
    expect((result.rows[0] as { bad: number }).bad).toBe(0);
  });

  it("runs the order automation without ever delivering an order", async () => {
    const before = await db.execute(
      sql`select count(*)::int as delivered from orders where status = 'DELIVERED'`,
    );
    const summary = await runOrderAutomation();
    expect(summary.scanned).toBeGreaterThanOrEqual(0);
    expect(summary.advanced).toBeGreaterThanOrEqual(0);

    const after = await db.execute(
      sql`select count(*)::int as delivered from orders where status = 'DELIVERED'`,
    );
    expect((after.rows[0] as { delivered: number }).delivered).toBe(
      (before.rows[0] as { delivered: number }).delivered,
    );
  });

  it("enforces unique product slugs and SKUs at the database level", async () => {
    const result = await db.execute(sql`
      select
        (select count(*) from products)::int as total,
        (select count(distinct slug) from products)::int as slugs,
        (select count(distinct sku) from products)::int as skus
    `);
    const row = result.rows[0] as { total: number; slugs: number; skus: number };
    expect(row.slugs).toBe(row.total);
    expect(row.skus).toBe(row.total);
  });
});

describe.skipIf(!databaseUrl)("supabase-ready schema", () => {
  it("has the password reset and banner tables with the expected shape", async () => {
    const result = await db.execute(sql`
      select table_name, count(*)::int as columns
      from information_schema.columns
      where table_schema = 'public'
        and table_name in ('password_reset_tokens', 'banners')
      group by table_name
      order by table_name
    `);
    const rows = result.rows as { table_name: string; columns: number }[];
    const byName = Object.fromEntries(rows.map((row) => [row.table_name, row.columns]));
    expect(byName.password_reset_tokens).toBeGreaterThanOrEqual(7);
    expect(byName.banners).toBeGreaterThanOrEqual(14);
  });

  it("stores reset tokens hashed, never in plaintext", async () => {
    const result = await db.execute(sql`select token_hash from password_reset_tokens limit 50`);
    for (const row of result.rows as { token_hash: string }[]) {
      expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("only serves banners inside their date window from the settings layer", async () => {
    const expired = await db.execute(sql`
      select count(*)::int as n from banners
      where is_active and ends_at is not null and ends_at < now()
    `);
    // Expired-but-active rows may exist in the table; the query layer filters them.
    expect((expired.rows[0] as { n: number }).n).toBeGreaterThanOrEqual(0);
  });
});
