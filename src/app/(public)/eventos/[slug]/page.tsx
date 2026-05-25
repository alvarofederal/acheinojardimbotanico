import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { ArrowLeft, Calendar, MapPin, ExternalLink } from "lucide-react"

export const revalidate = 600
interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const e = await db.event.findUnique({ where: { slug } })
  if (!e) return {}
  return { title: e.title, description: e.excerpt ?? undefined,
    openGraph: { title: e.title, description: e.excerpt ?? undefined, images: e.coverUrl ? [e.coverUrl] : undefined, type: "article" } }
}

export default async function EventArticlePage({ params }: PageProps) {
  const { slug } = await params
  const ev = await db.event.findUnique({ where: { slug } })
  if (!ev || ev.status !== "PUBLISHED") notFound()

  const dateLabel = ev.eventDate
    ? new Date(ev.eventDate).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Event",
    name: ev.title, startDate: ev.eventDate?.toISOString(),
    location: ev.eventLocation ? { "@type": "Place", name: ev.eventLocation } : undefined,
    image: ev.coverUrl ?? undefined, description: ev.excerpt ?? ev.content.slice(0, 200),
  }

  const mapsUrl = ev.eventLocation ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.eventLocation)}` : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/eventos" className="inline-flex items-center gap-1.5 text-sm flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Eventos
        </Link>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink leading-tight">{ev.title}</h1>

        {ev.coverUrl && <img src={ev.coverUrl} alt={ev.title} className="w-full rounded-3xl mt-6" />}

        {/* Data + local em destaque */}
        <div className="flex flex-wrap gap-3 mt-6">
          {dateLabel && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flora-card text-sm flora-ink">
              <Calendar className="w-4 h-4 text-flora-green dark:text-flora-fresh" /> <span className="capitalize">{dateLabel}</span>
            </div>
          )}
          {ev.eventLocation && (
            <a href={mapsUrl!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flora-card text-sm flora-ink hover:text-flora-green dark:hover:text-flora-fresh transition-colors">
              <MapPin className="w-4 h-4 text-flora-green dark:text-flora-fresh" /> {ev.eventLocation}
            </a>
          )}
        </div>

        <div className="mt-6 space-y-4 text-[17px] leading-relaxed flora-ink">
          {ev.content.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        </div>

        {ev.eventUrl && (
          <a href={ev.eventUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-flora-green hover:bg-flora-fresh text-white text-sm font-semibold transition-all">
            Quero participar <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </article>
    </>
  )
}
