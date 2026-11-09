import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description:
    "The terms that govern your use of the NEXVORO store, placing orders and your statutory rights.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & conditions"
      description="These terms apply every time you browse or order from NEXVORO. They are written to be readable — if anything is unclear, contact us before ordering."
      updatedAt="9 November 2026"
      sections={[
        {
          heading: "Using this store",
          paragraphs: [
            `By using ${SITE.name} you agree to these terms. You must be at least 18 years old, or have permission from a parent or guardian, to place an order.`,
            "You agree not to misuse the store: no automated scraping, no attempts to bypass authentication or rate limits, no uploading malicious content, and no ordering on behalf of someone else without their consent.",
          ],
        },
        {
          heading: "Products and pricing",
          paragraphs: [
            "We describe products as accurately as we can, including specifications supplied by manufacturers. Photographs and renders are illustrative; minor differences in finish or packaging do not constitute a fault.",
            "Prices are shown in Pakistani Rupees and include applicable tax unless stated otherwise. Delivery charges are shown separately at checkout before you pay.",
            "If a product is listed at a clearly incorrect price due to a technical error, we may cancel the order and refund any payment in full rather than fulfil it. We will contact you first.",
          ],
        },
        {
          heading: "Orders and acceptance",
          paragraphs: [
            "Your order is an offer to buy. A contract is formed when we confirm the order and take payment (or accept a cash-on-delivery order). Before then we may decline an order — for example if stock has run out, the delivery address is outside our service area, or we suspect fraud.",
            "Order confirmation is sent to the email address you provide. Keep it safe: it contains your order number and tracking code.",
          ],
        },
        {
          heading: "Payment",
          paragraphs: [
            "We accept cash on delivery, bank transfer and — where enabled on this deployment — card and mobile wallet payments. Cash on delivery is payable in full to the courier at handover.",
            "Online payments are verified server-side before an order is confirmed. We never ask for your card details by phone, email or WhatsApp.",
          ],
        },
        {
          heading: "Delivery",
          paragraphs: [
            "Delivery windows are estimates, not guarantees. Couriers can be delayed by weather, public holidays or events outside our control.",
            "Risk passes to you when the parcel is handed over at your delivery address. Please inspect the parcel at handover where possible and report damage or missing items within 48 hours.",
            "An order is only marked as delivered after you confirm receipt in your account, or when we resolve a dispute with you directly. We never mark an order delivered simply because a date has passed.",
          ],
        },
        {
          heading: "Warranty",
          paragraphs: [
            "All products carry the manufacturer's warranty stated on the product page. Warranty does not cover accidental damage, liquid damage, unauthorised repairs or normal wear.",
            "Keep your order confirmation: it is your proof of purchase for warranty claims.",
          ],
        },
        {
          heading: "Returns and refunds",
          paragraphs: [
            "Returns are governed by our Return and Refund policy, which forms part of these terms.",
          ],
        },
        {
          heading: "Accounts",
          paragraphs: [
            "You are responsible for keeping your password confidential and for activity under your account. Tell us immediately if you suspect unauthorised access so we can revoke all sessions.",
          ],
        },
        {
          heading: "Limitation of liability",
          paragraphs: [
            "Nothing in these terms limits liability that cannot be limited by law, including for death, personal injury or fraud.",
            "Subject to that, our total liability for any claim relating to an order is limited to the amount you paid for that order.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            "These terms are governed by the laws of the Islamic Republic of Pakistan, and the courts of Lahore have exclusive jurisdiction over any dispute.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [`Questions about these terms? Email ${SITE.supportEmail}.`],
        },
      ]}
    />
  );
}
