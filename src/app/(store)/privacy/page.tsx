import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How NEXVORO collects, uses, stores and protects your personal data, and the rights you have over it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      description="We collect the minimum data needed to sell you electronics, deliver them and support you afterwards. This page explains exactly what that means in practice."
      updatedAt="9 November 2026"
      sections={[
        {
          heading: "Who we are",
          paragraphs: [
            `${SITE.name} operates this store and is the data controller for the information described here. You can reach our privacy contact at ${SITE.supportEmail} or by post at ${SITE.address}.`,
          ],
        },
        {
          heading: "What we collect",
          paragraphs: [
            "We only ask for information we need to complete an order or to keep your account secure.",
          ],
          bullets: [
            "Account data: name, email address, phone number and a hashed password (we never store your password in plain text).",
            "Order data: items purchased, prices, delivery address, delivery notes and order status history.",
            "Payment data: your chosen method and, for bank transfers, the reference you provide. Card numbers are never stored on our servers — card payments are handled by the payment provider when that integration is enabled.",
            "Support data: messages you send us through the contact form or by email.",
            "Technical data: IP address and user agent recorded against your session so we can protect your account from abuse.",
          ],
        },
        {
          heading: "What we do not collect",
          paragraphs: [
            "We do not run advertising trackers, we do not sell customer data, and we do not use third-party analytics that profile you across other websites.",
          ],
        },
        {
          heading: "Why we use your data",
          paragraphs: [
            "To create and manage your account, to process and deliver orders, to send transactional messages about your order (including delivery confirmation requests), to handle returns and warranty claims, to prevent fraud and abuse, and to meet our accounting obligations.",
            "Marketing email is optional and only sent if you opt in. Every marketing email contains a one-click unsubscribe link.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "We use a small number of strictly necessary cookies: a session cookie to keep you signed in, a cart cookie so your basket survives a page refresh, and preference cookies that remember your chosen theme and font. None of these are used for advertising or profiling.",
          ],
        },
        {
          heading: "How long we keep data",
          paragraphs: [
            "Order and invoice records are kept for the period required by tax law. Account data is kept while your account is active; if you ask us to delete your account we remove personal identifiers while retaining anonymised order statistics. Session records are deleted shortly after they expire or are revoked.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            `You can request a copy of your data, ask us to correct it, ask us to delete it, or object to specific processing. Email ${SITE.supportEmail} and we will respond within 30 days.`,
          ],
          bullets: [
            "Access and portability: receive a machine-readable copy of your account and order data.",
            "Correction: fix inaccurate details in your dashboard or by contacting us.",
            "Deletion: request removal of your account and personal data.",
            "Marketing: unsubscribe at any time without affecting order messages.",
          ],
        },
        {
          heading: "Security",
          paragraphs: [
            "Passwords are hashed with bcrypt, sessions use HTTP-only cookies with server-side validation, all administrative actions are recorded in an audit log, and access to customer data is restricted to staff who need it. All traffic in production is served over HTTPS.",
          ],
        },
        {
          heading: "Changes to this policy",
          paragraphs: [
            "If we make a material change we will update the date at the top of this page and, where the change affects existing customers, notify account holders by email.",
          ],
        },
      ]}
    />
  );
}
