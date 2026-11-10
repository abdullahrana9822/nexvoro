import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about delivery, warranty, returns, payments, order tracking and delivery confirmation at NEXVORO.",
  alternates: { canonical: "/faq" },
};

const GROUPS = [
  {
    title: "Orders & delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery takes 3–5 business days, express takes 1–2 business days in Lahore, Karachi and Islamabad, and same-day metro is available in Lahore for orders placed before 12pm. You will see the exact options and prices at checkout.",
      },
      {
        q: "Can I track my order?",
        a: "Yes. Every order gets a tracking code as soon as it is created. Use the track order page with either your order number (e.g. NX-2026-10041) or the tracking code. Registered customers also get live progress in their dashboard.",
      },
      {
        q: "Why does my order show 99% instead of delivered?",
        a: "That is deliberate. Our system moves orders through each stage automatically, but the final 1% — delivered — is only completed when you confirm receipt, or when an administrator resolves your case. We never mark an order delivered just because a date has passed.",
      },
      {
        q: "What happens if the courier says delivered but nothing arrived?",
        a: "Do not confirm delivery. Choose “No, not yet” in your order and describe what happened. Our team is alerted immediately, investigates with the courier, and resolves within 3 business days.",
      },
      {
        q: "Do you deliver outside Pakistan?",
        a: "Not at the moment. This storefront ships within Pakistan only.",
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "Cash on delivery is available nationwide. Bank transfer is also supported. Card and mobile wallet payments appear at checkout when the payment gateway is configured on the deployment.",
      },
      {
        q: "Is my card data stored?",
        a: "No. Card details are handled entirely by the payment provider when online payments are enabled. We only store the payment method, status and provider reference.",
      },
      {
        q: "Do you offer discounts or coupons?",
        a: "Yes — active coupons are shown in seasonal promotions. Enter the code in your cart or at checkout and the discount is validated server-side before the order is created.",
      },
    ],
  },
  {
    title: "Warranty & returns",
    items: [
      {
        q: "Is the warranty genuine?",
        a: "Yes. Every product ships with the official local warranty stated on its product page. All units are sourced through official distribution channels and arrive sealed.",
      },
      {
        q: "How do I return something?",
        a: "Request a return within 7 days of delivery by contacting support with your order number. Where the fault is ours we arrange a free pickup; approved refunds are processed within 3 business days of inspection.",
      },
      {
        q: "Can I return earphones?",
        a: "Earphones can be returned if they are faulty, but not for change of mind once the hygiene seal is broken.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "Do I need an account to order?",
        a: "No — guest checkout works. An account lets you keep a wishlist, see order history, save addresses and confirm deliveries from the dashboard.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: "Email support from the address on your account and we will verify your identity and send a secure reset link.",
      },
      {
        q: "Can I change the website theme?",
        a: "Yes. Use the theme button in the header to switch between eight complete themes and six font choices. Your preference is saved and applied on every page, on every visit.",
      },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GROUPS.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-fg">FAQ</span>
      </nav>

      <h1 className="mt-3 text-2xl font-black tracking-tight text-fg sm:text-3xl">
        Frequently asked questions
      </h1>
      <p className="mt-1 max-w-xl text-sm text-fg-muted">
        Straight answers about ordering, delivery, payments and warranty. Still stuck?{" "}
        <Link href="/contact" className="font-semibold text-brand hover:underline">
          Contact support
        </Link>
        .
      </p>

      <div className="mt-8 max-w-3xl space-y-8">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-fg-subtle">
              {group.title}
            </h2>
            <div className="mt-3 space-y-2">
              {group.items.map((item) => (
                <details
                  key={item.q}
                  className="panel group px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-fg">
                    {item.q}
                    <ChevronDown
                      className="size-4 shrink-0 text-fg-subtle transition group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
