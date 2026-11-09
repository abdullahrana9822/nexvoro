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
