import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Shipping policy",
  description:
    "Delivery options, charges, timelines, coverage and order tracking for NEXVORO electronics orders.",
  alternates: { canonical: "/shipping" },
};

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping policy"
      description="Delivery options, charges and timelines. Everything here is also shown at checkout before you pay."
      updatedAt="9 November 2026"
      sections={[
        {
          heading: "Delivery options",
          paragraphs: ["Choose the speed you need at checkout — the price updates live."],
          bullets: [
            "Standard delivery: 3–5 business days, PKR 2,500. Free on orders over PKR 150,000.",
            "Express delivery: 1–2 business days in Lahore, Karachi and Islamabad, PKR 5,500.",
            "Same-day metro: order before 12pm for delivery the same day in Lahore, PKR 8,500.",
          ],
        },
        {
          heading: "Coverage",
          paragraphs: [
            "We deliver nationwide across Pakistan through insured courier partners. Remote areas may add 1–2 days to the estimate; if that applies to your address we will tell you before dispatch.",
            "We do not currently ship internationally from this storefront.",
          ],
        },
        {
          heading: "Order processing",
          paragraphs: [
            "Orders placed before 4pm on a business day are picked the same day. Orders placed after that, or on Sundays and public holidays, are processed the next business day.",
            "Large or high-value items may require a confirmation call before dispatch — this protects both you and us from fraudulent orders.",
          ],
        },
        {
          heading: "Tracking",
          paragraphs: [
            "Every order gets a tracking code as soon as it is created. Track it any time from the track order page using either the order number or the tracking code. Registered customers also see live progress and their full history in the dashboard.",
          ],
        },
        {
          heading: "Delivery confirmation",
          paragraphs: [
            "Our system moves orders through each stage automatically and stops at 99%. The remaining 1% is completed only when you confirm receipt, or when an administrator resolves your case directly. We never mark an order delivered simply because the expected date has passed.",
          ],
        },
        {
          heading: "Failed deliveries",
          paragraphs: [
            "Couriers attempt delivery up to three times. If nobody is available, the parcel returns to our warehouse and we contact you to rebook. Re-delivery is free the first time; after that a delivery charge may apply.",
          ],
        },
        {
          heading: "Damaged or missing items",
          paragraphs: [
            "Inspect the outer packaging at handover where possible. Report damage or missing items within 48 hours of delivery with photos so we can claim against courier insurance and send a replacement quickly.",
          ],
        },
      ]}
    />
  );
}
