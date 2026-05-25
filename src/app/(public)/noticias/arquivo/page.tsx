import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { Newspaper, ArrowLeft } from "lucide-react"

export const revalidate = 600
export const metadata: Metadata = { title: "Todas as notícias" }

const fmt = (d: Date | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : ""

export default async function ArquivoNoticiasPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? "1"))
  const take = 18, skip = (pageNum - 1) * take

  const [news, total] = await Promise.all([
    db.news.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take, skip }),
    db.news.count({ where: { status: "PUBLISHED" } }),
  ])
  const totalPages = Math.ceil(total / take)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/noticias" className="inline-flex items-center gap-1.5 text-sm flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" /> Notícias
      </Link>
      <h1 className="font-serif text-3xl font-semibold flora-ink mb-8">Todas as notícias</h1>

      {news.length === 0 ? (
        <p className="flora-muted">Nenhuma notícia publicada ainda.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {news.map(n => (
            <Link key={n.id} href={`/noticias/${n.slug}`} className="flora-card rounded-2xl overflow-hidden group">
              <div className="aspect-[16/9] bg-flora-sand dark:bg-white/5 overflow-hidden">
                {n.coverUrl
                  ? <img src={n.coverUrl} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><Newspaper className="w-7 h-7 text-flora-green/30" /></div>}
              </div>
              <div className="p-4">
                <h2 className="font-serif text-lg font-semibold flora-ink leading-tight line-clamp-2 group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors">{n.title}</h2>
                <p className="text-xs flora-muted mt-1">{fmt(n.publishedAt)}</p>
              </div>
            </Link>
          ))}
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
