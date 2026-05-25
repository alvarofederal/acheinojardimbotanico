import type { Metadata } from "next"
import { db } from "@/lib/prisma"
import { ContentSections, type ContentItem } from "../_components/content-sections"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Eventos no Jardim Botânico",
  description: "Agenda de eventos do bairro Jardim Botânico (DF): feiras, shows, encontros e mais.",
}

const fmt = (d: Date | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : null

export default async function EventosPage() {
  const now = new Date()
  const events = await db.event.findMany({
    where: { status: "PUBLISHED", OR: [{ eventDate: { gte: now } }, { eventDate: null }] },
    orderBy: [{ featured: "desc" }, { eventDate: "asc" }],
    take: 8,
  })

  const items: ContentItem[] = events.map(e => {
    const isToday = e.eventDate && new Date(e.eventDate).toDateString() === now.toDateString()
    return {
      title: e.title,
      href: `/eventos/${e.slug}`,
      excerpt: e.excerpt,
      coverUrl: e.coverUrl,
      meta: [fmt(e.eventDate), e.eventLocation].filter(Boolean).join(" · ") || null,
      badge: isToday ? "Hoje" : null,
    }
  })

  return (
    <main>
      <section className="relative flora-hero overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <h1 className="font-serif font-semibold text-white leading-tight" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
            Eventos no <span className="italic text-flora-gold">Jardim Botânico</span>
          </h1>
          <p className="mt-4 text-white/75 max-w-lg mx-auto">A agenda do bairro: feiras, encontros, shows e novidades.</p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ height: "48px" }}>
          <path d="M0,45 C240,90 480,10 720,35 C960,60 1200,20 1440,40 L1440,90 L0,90 Z" className="fill-flora-cream dark:fill-flora-deep" />
        </svg>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <ContentSections items={items} moreHref="/eventos/arquivo" moreLabel="Mais eventos" emptyText="Nenhum evento marcado por enquanto" />
      </section>
    </main>
  )
}
