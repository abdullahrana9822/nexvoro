import { Quote } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { initials } from "@/lib/utils";

const TESTIMONIALS = [
  {
    name: "Hira Nadeem",
    role: "Product designer, Lahore",
    quote:
      "Ordered the Aurora Pro on a Thursday evening and it was in my hands by Saturday. The invoice, warranty card and packaging were all exactly as promised.",
    rating: 5,
  },
  {
    name: "Faisal Iqbal",
    role: "Esports coach, Karachi",
    quote:
      "I have bought three gaming machines from NEXVORO for the team. Zero dead pixels, zero delays, and they actually answer the phone when something needs sorting.",
    rating: 5,
  },
  {
    name: "Zainab Raza",
    role: "Photographer, Islamabad",
    quote:
      "The Lumen R7 arrived calibrated and sealed. The team even followed up a week later to check the autofocus behaviour I asked about.",
    rating: 4,
  },
];

export function Testimonials() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TESTIMONIALS.map((item) => (
        <figure
          key={item.name}
          className="panel relative flex flex-col p-5 transition hover:border-border-strong"
        >
          <Quote className="size-6 text-brand/40" aria-hidden />
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
            “{item.quote}”
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
            <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
              {initials(item.name)}
            </span>
            <span>
              <span className="block text-sm font-bold text-fg">{item.name}</span>
              <span className="block text-[11px] text-fg-subtle">{item.role}</span>
            </span>
            <Rating value={item.rating} size={12} className="ml-auto" />
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
