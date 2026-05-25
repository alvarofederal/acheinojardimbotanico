import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { CalendarDays, ArrowLeft } from "lucide-react"

export const revalidate = 600
export const metadata: Metadata = { title: "Todos os eventos" }

const fmt = (d: Date | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : ""

export default async function ArquivoEventosPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? "1"))
  const take = 18, skip = (pageNum - 1) * take
  const now = new Date()

  const [events, total] = await Promise.all([
    db.event.findMany({ where: { status: "PUBLISHED" }, orderBy: { eventDate: "desc" }, take, skip }),
    db.event.count({ where: { status: "PUBLISHED" } }),
  ])
  const totalPages = Math.ceil(total / take)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/eventos" className="inline-flex items-center gap-1.5 text-sm flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" /> Eventos
      </Link>
      <h1 className="font-serif text-3xl font-semibold flora-ink mb-8">Todos os eventos</h1>

      {events.length === 0 ? (
        <p className="flora-muted">Nenhum evento publicado ainda.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(e => {
            const past = e.eventDate && new Date(e.eventDate) < now
            return (
              <Link key={e.id} href={`/eventos/${e.slug}`} className="flora-card rounded-2xl overflow-hidden group">
                <div className="relative aspect-[16/9] bg-flora-sand dark:bg-white/5 overflow-hidden">
                  {e.coverUrl
                    ? <img src={e.coverUrl} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><CalendarDays className="w-7 h-7 text-flora-green/30" /></div>}
                  {past && <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-700/80 text-white">Encerrado</span>}
                </div>
                <div className="p-4">
                  <h2 className="font-serif text-lg font-semibold flora-ink leading-tight line-clamp-2 group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors">{e.title}</h2>
                  <p className="text-xs flora-muted mt-1">{[fmt(e.eventDate), e.eventLocation].filter(Boolean).join(" · ")}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {pageNum > 1 && <Link href={`?page=${pageNum - 1}`} className="px-4 py-2 rounded-full flora-chip flora-ink text-sm">Anterior</Link>}
          {pageNum < totalPages && <Link href={`?page=${pageNum + 1}`} className="px-4 py-2 rounded-full flora-chip flora-ink text-sm">Próxima</Link>}
        </div>
      )}
    </main>
  )
}
