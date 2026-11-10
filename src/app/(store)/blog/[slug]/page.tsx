import Link from "next/link";
import { notFound } from "next/navigation";
import { getStories } from "@/lib/editorial-data";
export default async function ArticlePage({ params }: { params: Promise<{slug:string}> }) {
 const {slug}=await params;const story=(await getStories()).find(item=>item.slug===slug);if(!story)notFound();
 return <article className="container-page py-14"><div className="mx-auto max-w-3xl"><Link href="/blog" className="text-xs text-fg-muted">← The Journal</Link><p className="editorial-kicker mt-10 text-brand">{story.category}</p><h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-.04em] sm:text-6xl">{story.title}</h1><p className="mt-7 border-b border-border pb-8 text-lg text-fg-muted">{story.summary}</p><div className="space-y-6 py-10">{story.paragraphs.map((text,i)=><p key={i} className="text-base leading-8 text-fg-muted">{text}</p>)}</div><Link href={story.collection} className="inline-flex rounded-full bg-brand px-7 py-3 text-sm font-semibold text-brand-fg">Explore the collection →</Link></div></article>;
}
