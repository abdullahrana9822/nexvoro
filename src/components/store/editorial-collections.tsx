import Link from "next/link";
import { ArrowUpRight, AudioLines, Laptop, Smartphone, Gamepad2 } from "lucide-react";

const worlds = [
  { number: "01", title: "Find your focus.", category: "WORK & CREATE", description: "Your next big idea deserves a better workspace.", href: "/shop?category=laptops", Icon: Laptop, tone: "workspace", detail: "Laptops & essentials" },
  { number: "02", title: "Feel every note.", category: "SOUND & SILENCE", description: "Turn the world down. Turn your music up.", href: "/shop?category=headphones", Icon: AudioLines, tone: "sound", detail: "Headphones & audio" },
  { number: "03", title: "Stay in your world.", category: "CONNECT & EXPLORE", description: "Powerful possibilities. Right in your pocket.", href: "/shop?category=smartphones", Icon: Smartphone, tone: "connect", detail: "Smartphones & accessories" },
  { number: "04", title: "Beyond the ordinary.", category: "PLAY & DISCOVER", description: "Build a setup that brings every adventure closer.", href: "/shop?category=gaming", Icon: Gamepad2, tone: "play", detail: "Gaming & gear" },
];

export function EditorialCollections() {
  return (
    <section id="curated-worlds" className="container-page editorial-section" aria-labelledby="worlds-heading">
      <div className="editorial-section-heading">
        <div><p className="editorial-kicker">A LITTLE MORE YOU</p><h2 id="worlds-heading">Not just technology.<br /><span>A world of possibilities.</span></h2></div>
        <p>Thoughtfully chosen for the things you love.<br />Find your next everyday essential.</p>
      </div>
      <div className="editorial-worlds">
        {worlds.map(({ number, title, category, description, href, Icon, tone, detail }) => (
          <Link href={href} key={number} className={`editorial-world editorial-world-${tone}`}>
            <div className="flex items-center justify-between"><span className="editorial-kicker">{category}</span><span className="text-xs opacity-40">/{number}</span></div>
            <div className="editorial-object" aria-hidden><Icon strokeWidth={0.75} /></div>
            <div className="relative z-10"><p className="mb-2 text-[10px] uppercase tracking-[.16em] opacity-55">{detail}</p><h3>{title}</h3><p className="mt-2 max-w-60 text-xs leading-relaxed opacity-65">{description}</p><span className="editorial-world-arrow"><ArrowUpRight className="size-5" aria-hidden /></span></div>
          </Link>
        ))}
      </div>
      <div className="editorial-manifesto"><p>LESS NOISE. MORE POSSIBILITY.</p><span>Good technology disappears into a better life.</span><Link href="/about">Meet NEXVORO <ArrowUpRight className="size-4" aria-hidden /></Link></div>
    </section>
  );
}
