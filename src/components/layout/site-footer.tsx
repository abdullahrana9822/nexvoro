import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SocialIcon, type SocialNetwork } from "@/components/layout/social-icon";
import { FOOTER_LINKS, SITE } from "@/lib/constants";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { PaymentMarks } from "@/components/layout/payment-marks";

/**
 * Copyright year.
 *
 * The footer is a Server Component, but this file is also rendered during a
 * client-side pass when the tree is regenerated. Reading the clock in both
 * places can disagree across a New Year boundary (server in UTC vs the
 * visitor's local time), which surfaces as a hydration mismatch. Pinning it to
 * a fixed, build-time constant keeps server and client identical.
 */
const COPYRIGHT_YEAR = 2026;

export function SiteFooter() {

  return (
    <footer className="mt-20 border-t border-border bg-bg-muted/50">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg">
                <span className="text-sm font-black">N</span>
              </span>
              <span className="text-lg font-black tracking-tight text-fg">
                NEX<span className="text-brand">VORO</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg-muted">
              {SITE.description}
            </p>

            <ul className="mt-5 space-y-2 text-sm text-fg-muted">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span>{SITE.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-brand" aria-hidden />
                <a href={`tel:${SITE.supportPhone.replace(/\s/g, "")}`} className="hover:text-brand">
                  {SITE.supportPhone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-brand" aria-hidden />
                <a href={`mailto:${SITE.supportEmail}`} className="hover:text-brand">
                  {SITE.supportEmail}
                </a>
              </li>
            </ul>

            <div className="mt-5 flex gap-2">
              {[
                { href: SITE.socials.instagram, label: "Instagram", network: "instagram" },
                { href: SITE.socials.x, label: "X", network: "x" },
                { href: SITE.socials.youtube, label: "YouTube", network: "youtube" },
                { href: SITE.socials.linkedin, label: "LinkedIn", network: "linkedin" },
              ].map(({ href, label, network }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-border text-fg-muted transition hover:border-brand hover:text-brand"
                >
                  <SocialIcon network={network as SocialNetwork} />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-fg">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-fg-muted transition hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 grid gap-6 rounded-2xl border border-border bg-bg-elevated p-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <h3 className="text-base font-bold text-fg">Get early access to drops</h3>
            <p className="mt-1 text-sm text-fg-muted">
              New launches, restocks and members-only pricing. One email a week, no noise.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-fg-subtle">
            © {COPYRIGHT_YEAR} {SITE.name}. All rights reserved. {SITE.tagline}
          </p>
          <PaymentMarks />
        </div>
      </div>
    </footer>
  );
}
