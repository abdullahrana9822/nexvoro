import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Return & refund policy",
  description:
    "How to return a NEXVORO product, what is eligible, how long refunds take and how warranty claims work.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Return & refund policy"
      description="If something is wrong with your order we will fix it. This page explains what is eligible, how to start a return and when your money comes back."
      updatedAt="9 November 2026"
      sections={[
        {
          heading: "The 7-day window",
          paragraphs: [
            "You can request a return within 7 calendar days of receiving your order. The clock starts when the courier hands the parcel over, or when you confirm delivery in your account — whichever comes first.",
            "Contact us with your order number and a description of the problem, plus photos where relevant. We reply within one business day with return instructions.",
          ],
        },
        {
          heading: "What is eligible",
          paragraphs: ["You can return an item if:"],
          bullets: [
            "It arrived damaged, dead on arrival or not as described.",
            "It developed a hardware fault within the warranty period.",
            "You received the wrong model, colour or quantity.",
            "It is unused, unopened and still in its original sealed packaging (change-of-mind returns).",
          ],
        },
        {
          heading: "What is not eligible",
          paragraphs: [
            "We cannot accept returns for items that have been used beyond inspection, physically damaged after delivery, modified or repaired by a third party, or where hygiene seals on earphones have been broken. Software licences and digital gift cards are non-refundable once issued.",
          ],
        },
        {
          heading: "How to return",
          paragraphs: ["Returns are straightforward and tracked end to end."],
          bullets: [
            "1. Contact support with your order number and the reason for the return.",
            "2. We issue a return authorisation and, where the fault is ours, arrange a free pickup.",
            "3. Pack the item with all accessories, manuals and the original box.",
            "4. Once the item is inspected at our warehouse we approve the refund or replacement.",
          ],
        },
        {
          heading: "Refund timelines",
          paragraphs: [
            "Approved refunds are processed within 3 business days of inspection. Cash-on-delivery orders are refunded by bank transfer or mobile wallet to an account you nominate. Bank transfers typically clear within 1–3 business days after we send them.",
            "Original delivery charges are refunded when the return is due to our error or a product fault. For change-of-mind returns, the original delivery charge is not refunded.",
          ],
        },
        {
          heading: "Exchanges",
          paragraphs: [
            "If you would prefer a replacement rather than a refund, tell us when you open the return. Replacements are dispatched as soon as stock is available, and we reserve the unit when your return is authorised.",
          ],
        },
        {
          heading: "Warranty claims",
          paragraphs: [
            "Warranty claims are handled in-house. Send us the order number and a description of the fault; we arrange diagnostics with the authorised service partner and keep you updated at every step. Please back up your data before sending any device for service.",
          ],
        },
        {
          heading: "Disputed deliveries",
          paragraphs: [
            "If a courier marks a parcel delivered but you have not received it, do not confirm delivery. Instead use the “No, not yet” option in your order, which alerts our team immediately. We investigate with the courier and resolve within 3 business days.",
          ],
        },
        {
          heading: "Need help?",
          paragraphs: [
            `Email ${SITE.supportEmail} with your order number, or use the contact form.`,
          ],
        },
      ]}
    >
      <div className="panel p-5">
        <p className="text-sm font-semibold text-fg">Start a return</p>
        <p className="mt-1 text-xs text-fg-muted">
          Have your order number ready (it looks like NX-2026-10041).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/contact"
            className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-xs font-bold text-brand-fg"
          >
            Contact support
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex h-10 items-center rounded-full border border-border px-5 text-xs font-semibold text-fg"
          >
            Open my orders
          </Link>
        </div>
      </div>
    </LegalPage>
  );
}
