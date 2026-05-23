import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/prisma"
import { BusinessCard } from "./_components/business-card"
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

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 dark:text-white/30 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Início</Link>
          <span>/</span>
          <span className="text-gray-600 dark:text-white/60">{bairroLabel}</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {category.name} em {bairroLabel}
          </h1>
          <p className="text-gray-500 dark:text-white/40 mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            {businesses.length} {businesses.length === 1 ? "estabelecimento encontrado" : "estabelecimentos encontrados"}
          </p>
        </div>

        {/* Lista */}
        {businesses.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-white/30">
            <p className="text-lg font-medium mb-2">Nenhum negócio encontrado ainda</p>
            <p className="text-sm mb-6">Em breve teremos novidades aqui.<br />Conhece algum? Nos conte!</p>
            <Link href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">
              Cadastrar negócio
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map(business => (
              <BusinessCard
                key={business.id}
                business={business}
                bairro={bairro}
                categoria={categoria}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
