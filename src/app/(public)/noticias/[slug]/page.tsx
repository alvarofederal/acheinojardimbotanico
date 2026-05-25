import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { ArrowLeft, Calendar } from "lucide-react"

export const revalidate = 600

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const n = await db.news.findUnique({ where: { slug } })
  if (!n) return {}
  return {
    title: n.title,
    description: n.excerpt ?? undefined,
    openGraph: { title: n.title, description: n.excerpt ?? undefined, images: n.coverUrl ? [n.coverUrl] : undefined, type: "article" },
  }
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params
  const news = await db.news.findUnique({ where: { slug } })
  if (!news || news.status !== "PUBLISHED") notFound()

  const date = news.publishedAt ? new Date(news.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : null

  const related = await db.news.findMany({
    where: { status: "PUBLISHED", NOT: { id: news.id } },
    orderBy: { publishedAt: "desc" }, take: 3,
  })

  const jsonLd = {
    "@context": "https://schema.org", "@type": "NewsArticle",
    headline: news.title, datePublished: news.publishedAt?.toISOString(),
    image: news.coverUrl ?? undefined, articleBody: news.content,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/noticias" className="inline-flex items-center gap-1.5 text-sm flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Notícias
        </Link>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink leading-tight">{news.title}</h1>
        {date && <p className="flex items-center gap-1.5 text-sm flora-muted mt-3"><Calendar className="w-4 h-4" /> {date}</p>}

        {news.coverUrl && (
          <img src={news.coverUrl} alt={news.title} className="w-full rounded-3xl mt-6 mb-2" />
        )}

        <div className="mt-6 space-y-4 text-[17px] leading-relaxed flora-ink">
          {news.content.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        </div>

        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-flora-green/[0.08] dark:border-white/[0.06]">
            <h2 className="font-serif text-xl font-semibold flora-ink mb-4">Veja também</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/noticias/${r.slug}`} className="flora-card rounded-2xl overflow-hidden group">
                  <div className="aspect-[16/9] bg-flora-sand dark:bg-white/5 overflow-hidden">
                    {r.coverUrl && <img src={r.coverUrl} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <p className="p-3 text-sm font-semibold flora-ink line-clamp-2">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  )
}
