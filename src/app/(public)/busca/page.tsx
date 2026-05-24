import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { BusinessCard } from "../[bairro]/[categoria]/_components/business-card"
import { HeroSearch } from "../_components/hero-search"
import { SearchX } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `Busca: ${q}` : "Buscar", robots: { index: false } }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const term = (q ?? "").trim()

  const businesses = term
    ? await db.business.findMany({
        where: {
          status: { in: ["IMPORTED", "CLAIMED"] },
          OR: [
            { name: { contains: term } },
            { category: { name: { contains: term } } },
            { description: { contains: term } },
          ],
        },
        include: { category: true, photos: { take: 1, orderBy: { order: "asc" } } },
        orderBy: [{ plan: "desc" }, { googleRating: "desc" }],
        take: 60,
      })
    : []

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="max-w-xl mx-auto mb-10">
        <HeroSearchWrapper />
      </div>

      <h1 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink mb-1">
        {term ? <>Resultados para “{term}”</> : "O que você procura?"}
      </h1>
      {term && (
        <p className="flora-muted text-sm mb-8">
          {businesses.length} {businesses.length === 1 ? "estabelecimento encontrado" : "estabelecimentos encontrados"}
        </p>
      )}

      {term && businesses.length === 0 ? (
        <div className="text-center py-16">
          <SearchX className="w-12 h-12 text-flora-green/30 mx-auto mb-4" />
          <p className="font-serif text-xl flora-ink mb-1">Nada encontrado por aqui</p>
          <p className="text-sm flora-muted mb-6">Que tal tentar um termo mais amplo, como “café” ou “restaurante”?</p>
          <Link href="/" className="text-sm font-semibold text-flora-green dark:text-flora-fresh hover:underline">
            Voltar ao início
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map(b => (
            <BusinessCard
              key={b.id}
              business={b}
              bairro={slugify(b.neighborhood)}
              categoria={b.category.slug}
            />
          ))}
        </div>
      )}
    </main>
  )
}

// Wrapper só para reaproveitar o HeroSearch (client) no topo da busca
function HeroSearchWrapper() {
  return <HeroSearch />
}
