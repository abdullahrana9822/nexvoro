import { getStories } from "@/lib/editorial-data";
import type { MetadataRoute } from "next";
import { listProducts, getCategoryTree } from "@/lib/catalog";
import { env } from "@/lib/env";

export const revalidate = 3600;

/**
 * Dynamic sitemap: static pages, every active product, and every category
 * collection. Regenerated hourly so new products appear without a redeploy.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const now = new Date();

  const staticPaths: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/experiences", priority: 0.6, changeFrequency: "monthly" },
    { path: "/themes", priority: 0.6, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
    { path: "/news", priority: 0.5, changeFrequency: "weekly" },
    { path: "/support", priority: 0.5, changeFrequency: "monthly" },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" },
    { path: "/categories", priority: 0.8, changeFrequency: "weekly" },
    { path: "/search", priority: 0.4, changeFrequency: "weekly" },
    { path: "/about", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
    { path: "/shipping", priority: 0.5, changeFrequency: "monthly" },
    { path: "/returns", priority: 0.5, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/track", priority: 0.4, changeFrequency: "monthly" },
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((item) => ({
    url: `${base}${item.path}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  for (const story of await getStories()) entries.push({ url: `${base}/blog/${story.slug}`, changeFrequency: "monthly", priority: 0.5 });

  try {
    const [products, categories] = await Promise.all([
      listProducts({ page: 1 }),
      getCategoryTree(),
    ]);

    // Pull every page of products so nothing is omitted from the sitemap.
    const pageCount = products.pageCount ?? 1;
    const rest =
      pageCount > 1
        ? await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, index) =>
              listProducts({ page: index + 2 }),
            ),
          )
        : [];
    const allProducts = [products, ...rest].flatMap((page) => page.items);

    for (const product of allProducts) {
      entries.push({
        url: `${base}/product/${product.slug}`,
        lastModified: product.updatedAt ?? now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const category of categories) {
      entries.push({
        url: `${base}/shop?category=${category.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
      for (const child of category.children) {
        entries.push({
          url: `${base}/shop?category=${child.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  } catch {
    // A database hiccup must never break the sitemap; static entries still ship.
  }

  return entries;
}
