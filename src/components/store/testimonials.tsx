import { Quote } from "lucide-react";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviews, products, orders, orderItems } from "@/db/schema";
import { Rating } from "@/components/ui/rating";
import { initials } from "@/lib/utils";

/** Never invent social proof: only approved feedback from delivered purchases. */
export async function Testimonials() {
  const stories = await db
    .select({
      id: reviews.id,
      name: reviews.authorName,
      quote: reviews.body,
      rating: reviews.rating,
      product: products.name,
      slug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(
      and(
        eq(reviews.status, "APPROVED"),
        eq(products.status, "ACTIVE"),
        sql`length(trim(${reviews.body})) > 0`,
        sql`exists (select 1 from ${orders} inner join ${orderItems} on ${orderItems.orderId} = ${orders.id} where ${orders.userId} = ${reviews.userId} and ${orderItems.productId} = ${reviews.productId} and ${orders.status} = 'DELIVERED')`,
      ),
    )
    .orderBy(desc(reviews.createdAt))
    .limit(3);
  if (!stories.length)
    return (
      <div className="panel mx-auto max-w-2xl p-8 text-center">
        <Quote className="mx-auto size-7 text-brand" aria-hidden />
        <h3 className="mt-4 text-lg font-semibold">Your experience matters.</h3>
        <p className="mt-3 text-sm leading-6 text-fg-muted">
          Customer stories will appear here after delivered purchases are
          reviewed and approved. We do not publish invented testimonials.
        </p>
      </div>
    );
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stories.map((item) => (
        <figure key={item.id} className="panel flex flex-col p-6">
          <Quote className="size-6 text-brand/50" aria-hidden />
          <blockquote className="mt-4 flex-1 text-sm leading-7 text-fg-muted">
            “{item.quote}”
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
              {initials(item.name)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="block text-[10px] text-fg-muted">
                Verified delivered purchase
              </span>
            </span>
            <Rating value={item.rating} size={12} className="ml-auto" />
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
