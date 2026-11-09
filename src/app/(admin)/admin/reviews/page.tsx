import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { ReviewModeration } from "@/components/admin/review-moderation";
import { Rating } from "@/components/ui/rating";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "PENDING" } = await searchParams;

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      status: reviews.status,
      authorName: reviews.authorName,
      createdAt: reviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(
      status === "ALL"
        ? undefined
        : eq(reviews.status, status as "PENDING" | "APPROVED" | "REJECTED"),
    )
    .orderBy(desc(reviews.createdAt))
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-black tracking-tight text-fg">Reviews</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Only approved reviews appear on the storefront and count toward product ratings.
      </p>

      <div className="mt-4 flex gap-1.5">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((tab) => (
          <Link
            key={tab}
            href={`/admin/reviews?status=${tab}`}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              status === tab
                ? "border-brand bg-brand text-brand-fg"
                : "border-border text-fg-muted hover:border-brand"
            }`}
          >
            {tab.toLowerCase()}
          </Link>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <li className="panel p-8 text-center text-xs text-fg-subtle">
            No reviews in this view.
          </li>
        ) : (
          rows.map((review) => (
            <li key={review.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Rating value={review.rating} size={12} />
                    <span className="text-[10px] font-semibold text-fg-subtle">
                      {review.authorName} · {formatDateTime(review.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-fg">
                    {review.title ?? "No title"}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-fg-muted">
                    {review.body}
                  </p>
                  <Link
                    href={`/product/${review.productSlug}`}
                    target="_blank"
                    className="mt-1 inline-block text-[10px] font-semibold text-brand hover:underline"
                  >
                    {review.productName}
                  </Link>
                </div>
                <ReviewModeration reviewId={review.id} status={review.status} />
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
