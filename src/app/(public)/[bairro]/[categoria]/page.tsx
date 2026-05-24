import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/prisma"
import { CategoryList } from "./_components/category-list"
import { MapPin } from "lucide-react"
import Link from "next/link"

export const revalidate = 3600 // ISR 1h

interface PageProps {
  params: Promise<{ bairro: string; categoria: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bairro, categoria } = await params
  const category = await db.category.findUnique({ where: { slug: categoria } })
  if (!category) return {}

  const bairroLabel = bairro.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  const title = `${category.name} em ${bairroLabel}`

  return {
    title,
    description: `Encontre ${category.name.toLowerCase()} no ${bairroLabel} (DF). Lista completa com avaliações, horários e contatos.`,
    openGraph: { title, type: "website" },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { bairro, categoria } = await params

  const category = await db.category.findUnique({ where: { slug: categoria } })
  if (!category) notFound()

  const businesses = await db.business.findMany({
    where: {
      categoryId: category.id,
      status: { in: ["IMPORTED", "CLAIMED"] },
    },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
    },
    orderBy: [
      { plan: "desc" },
      { googleRating: "desc" },
    ],
  })

  const bairroLabel = bairro.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())

  // JSON-LD ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} em ${bairroLabel}`,
    numberOfItems: businesses.length,
    itemListElement: businesses.slice(0, 10).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: b.name,
        address: b.address,
        url: `https://acheinojardimbotanico.com.br/${bairro}/${categoria}/${b.slug}`,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs flora-muted mb-5 flex items-center gap-1.5">
          <Link href="/" className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">Início</Link>
          <span className="opacity-50">/</span>
          <span>{bairroLabel}</span>
          <span className="opacity-50">/</span>
          <span className="font-medium flora-ink">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flora-rise">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink">
            {category.name} <span className="italic text-flora-green dark:text-flora-fresh">no Jardim Botânico</span>
          </h1>
          <p className="flora-muted mt-2 flex items-center gap-1.5 text-sm">
            <MapPin className="w-3.5 h-3.5 text-flora-green" />
            {businesses.length} {businesses.length === 1 ? "estabelecimento" : "estabelecimentos"} em {bairroLabel}
          </p>
        </div>

        {/* Lista */}
        {businesses.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl flora-ink mb-2">Ainda cultivando esta categoria</p>
            <p className="text-sm flora-muted mb-6">Em breve teremos novidades aqui. Conhece algum? Nos conte!</p>
            <Link href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-flora-green hover:bg-flora-fresh text-white rounded-full text-sm font-semibold transition-all hover:shadow-lg">
              Cadastrar negócio
            </Link>
          </div>
        ) : (
          <CategoryList businesses={businesses} bairro={bairro} categoria={categoria} />
        )}
      </main>
    </>
  )
}
