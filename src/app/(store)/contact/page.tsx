import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Contact NEXVORO support about an order, warranty claim, return or product question. Email, phone and warehouse address.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-xs text-fg-subtle">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-fg">Contact</span>
      </nav>

      <h1 className="mt-3 text-2xl font-black tracking-tight text-fg sm:text-3xl">Contact us</h1>
      <p className="mt-1 max-w-xl text-sm text-fg-muted">
        Questions about an order, a warranty claim or which laptop fits your work? Send a
        message and a real person will reply.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {[
            {
              Icon: Mail,
              title: "Email",
              value: SITE.supportEmail,
              href: `mailto:${SITE.supportEmail}`,
              hint: "Best for order details and warranty claims",
            },
            {
              Icon: Phone,
              title: "Phone",
              value: SITE.supportPhone,
              href: `tel:${SITE.supportPhone.replace(/\s/g, "")}`,
              hint: "Mon–Sat, 9:00am – 7:00pm",
            },
            {
              Icon: MessageCircle,
              title: "Order in progress?",
              value: "Check your order status",
              href: "/track",
              hint: "Track any order with your order number or tracking code",
            },
            {
              Icon: MapPin,
              title: "Warehouse & showroom",
              value: SITE.address,
              href: "https://maps.google.com/?q=Gulberg+III+Lahore",
              hint: "Visits by appointment",
            },
          ].map(({ Icon, title, value, href, hint }) => (
            <a
              key={title}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
              className="panel flex items-start gap-3 p-4 transition hover:border-brand"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-wide text-fg-subtle">
                  {title}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-fg">{value}</span>
                <span className="mt-0.5 block text-[11px] text-fg-muted">{hint}</span>
              </span>
            </a>
          ))}

          <div className="panel flex items-start gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg-muted text-fg-muted">
              <Clock className="size-4" aria-hidden />
            </span>
            <div className="text-xs text-fg-muted">
              <p className="font-semibold text-fg">Response times</p>
              <p className="mt-1">
                Median first reply: under 2 hours during business hours. Warranty inspections are
                completed within 3 business days.
              </p>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
