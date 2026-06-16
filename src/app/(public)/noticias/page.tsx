import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@/lib/prisma"
import { getMenuVisibility } from "@/lib/site-visibility"
import { ContentSections, type ContentItem } from "../_components/content-sections"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Notícias do Jardim Botânico",
  description: "Acontecimentos, informações e novidades do bairro Jardim Botânico (DF).",
}

const fmtDate = (d: Date | null) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : null

export default async function NoticiasPage() {
  if (!(await getMenuVisibility()).noticias) notFound()
  const news = await db.news.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 8,
  })

  const items: ContentItem[] = news.map(n => ({
    title: n.title,
    href: `/noticias/${n.slug}`,
    excerpt: n.excerpt,
    coverUrl: n.coverUrl,
    meta: fmtDate(n.publishedAt),
  }))

  return (
    <main>
      <section className="relative flora-hero overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <h1 className="font-serif font-semibold text-white leading-tight" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)" }}>
            Notícias do <span className="italic text-flora-gold">Jardim Botânico</span>
          </h1>
          <p className="mt-4 text-white/75 max-w-lg mx-auto">O que acontece no bairro — informação confiável e local.</p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ height: "48px" }}>
          <path d="M0,45 C240,90 480,10 720,35 C960,60 1200,20 1440,40 L1440,90 L0,90 Z" className="fill-flora-cream dark:fill-flora-deep" />
        </svg>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <ContentSections items={items} moreHref="/noticias/arquivo" moreLabel="Mais notícias" emptyText="Ainda não há notícias publicadas" />
      </section>
    </main>
  )
}
