import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { lojaPath } from "@/lib/links"
import { getPlanConfigs } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { BusinessCard } from "../[bairro]/[categoria]/_components/business-card"
import { HeroSearch } from "../_components/hero-search"
import { MonsteraLeaf, LeafSprig } from "../_components/botanicals"
import { SearchX, Search, MapPin } from "lucide-react"

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

  const raw = term
    ? await db.business.findMany({
        where: {
          status: { in: ["IMPORTED", "CLAIMED"] },
          OR: [
            { name: { contains: term } },
            { category: { name: { contains: term } } },
            { description: { contains: term } },
          ],
        },
        include: {
          category: true,
          photos: { take: 1, orderBy: { order: "asc" } },
          products: { where: { active: true }, take: 1, select: { id: true } },
        },
        orderBy: [{ plan: "desc" }, { googleRating: "desc" }],
        take: 60,
      })
    : []

  // Destaque, selo e loja são recursos de plano — aplica por negócio (igual à listagem por categoria),
  // pra o card mostrar TODOS os extras (selo, "Ver loja", etc.) também na busca.
  const cfgs = term ? await getPlanConfigs() : null
  const businesses = raw
    .map(b => {
      const cfg = cfgs?.[b.plan as PlanId]
      const bairro = slugify(b.neighborhood)
      const hasStore = !!cfg?.features.loja && (b.products?.length ?? 0) > 0
      return {
        ...b,
        bairro,
        featured: cfg?.features.destaque ?? false,
        seloLabel: cfg?.features.selo ? cfg.label : null,
        storeHref: hasStore ? lojaPath(b) : null,
      }
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return (b.googleRating ?? 0) - (a.googleRating ?? 0)
    })

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Banner da busca — identidade Flora (mesmo padrão da listagem por categoria) */}
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-flora-deep via-[#123f2f] to-flora-green text-white px-6 sm:px-10 py-8 sm:py-11 flora-rise">
        <MonsteraLeaf aria-hidden className="pointer-events-none absolute -right-10 -top-12 w-64 h-64 text-white/[0.06]" />
        <LeafSprig aria-hidden className="pointer-events-none absolute right-[16%] -bottom-20 w-28 h-72 text-flora-fresh/10 hidden md:block" />
        <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-24 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(46,139,87,.35), transparent 70%)" }} />

        <div className="relative">
          {/* Breadcrumb */}
          <nav className="text-xs text-white/70 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <span className="opacity-50">/</span>
            <span className="font-medium text-white">Busca</span>
          </nav>

          {/* Ícone + kicker */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
              <Search className="w-5 h-5 text-flora-soft" strokeWidth={1.8} />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-flora-soft/90">Busca no Jardim Botânico</span>
          </div>

          {/* Título */}
          <h1 className="font-serif text-3xl sm:text-[2.4rem] leading-[1.06] font-semibold">
            {term
              ? <>Resultados para <span className="italic text-flora-gold">“{term}”</span></>
              : <>O que você <span className="italic text-flora-gold">procura</span>?</>}
          </h1>

          {/* Contagem */}
          {term && (
            <p className="mt-3 text-sm text-white/80 inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-flora-soft" />
              {businesses.length} {businesses.length === 1 ? "estabelecimento encontrado" : "estabelecimentos encontrados"}
            </p>
          )}

          {/* Busca (refinar) — sobre o verde, onde o estilo vidro+dourado funciona */}
          <div className="mt-6 max-w-xl">
            <HeroSearch />
          </div>
        </div>
      </header>

      {/* Resultados */}
      <div className="mt-7">
        {!term ? (
          <p className="text-center py-12 text-sm flora-muted">
            Digite ali em cima o que você procura no bairro — um café, um encanador, uma loja…
          </p>
        ) : businesses.length === 0 ? (
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
              <BusinessCard key={b.id} business={b} bairro={b.bairro} categoria={b.category.slug} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
