import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { getPlanConfigs } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { CategoryList } from "./_components/category-list"
import { getCategoryIcon } from "@/lib/category-icons"
import { MonsteraLeaf, LeafSprig } from "../../_components/botanicals"
import { MapPin, Star } from "lucide-react"
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

  // Vanity da loja: /{handle}/loja → redireciona pra loja canônica.
  // (/{handle} já é resolvido em [bairro]/page.tsx; aqui cobrimos o /loja.)
  if (categoria === "loja") {
    const vanity = await db.business.findUnique({
      where: { handle: bairro.toLowerCase() },
      select: { slug: true, neighborhood: true, status: true, category: { select: { slug: true } } },
    })
    if (vanity && vanity.status !== "SUSPENDED") {
      redirect(`/${slugify(vanity.neighborhood)}/${vanity.category.slug}/${vanity.slug}/loja`)
    }
    notFound()
  }

  const category = await db.category.findUnique({ where: { slug: categoria } })
  if (!category) notFound()

  const rawBusinesses = await db.business.findMany({
    where: {
      categoryId: category.id,
      status: { in: ["IMPORTED", "CLAIMED"] },
    },
    include: {
      photos: { orderBy: { order: "asc" }, take: 1 },
      products: { where: { active: true }, take: 1, select: { id: true } },
    },
    orderBy: { googleRating: "desc" },
  })

  // Destaque e selo são recursos de plano — aplica por negócio e reordena
  const cfgs = await getPlanConfigs()
  const businesses = rawBusinesses
    .map(b => {
      const cfg = cfgs[b.plan as PlanId]
      const hasStore = !!cfg?.features.loja && (b.products?.length ?? 0) > 0
      return {
        ...b,
        featured: cfg?.features.destaque ?? false,
        seloLabel: cfg?.features.selo ? cfg.label : null,
        storeHref: hasStore ? `/${bairro}/${categoria}/${b.slug}/loja` : null,
      }
    })
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return (b.googleRating ?? 0) - (a.googleRating ?? 0)
    })

  const bairroLabel = bairro.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  const Icon = getCategoryIcon(categoria)
  const rated = businesses.filter(b => b.googleRating != null)
  const avgRating = rated.length
    ? (rated.reduce((s, b) => s + (b.googleRating ?? 0), 0) / rated.length).toFixed(1)
    : null

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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Banner da categoria — identidade Flora */}
        <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-flora-deep via-[#123f2f] to-flora-green text-white px-6 sm:px-10 py-8 sm:py-11 flora-rise">
          <MonsteraLeaf aria-hidden className="pointer-events-none absolute -right-10 -top-12 w-64 h-64 text-white/[0.06]" />
          <LeafSprig aria-hidden className="pointer-events-none absolute right-[16%] -bottom-20 w-28 h-72 text-flora-fresh/10 hidden md:block" />
          <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-24 w-80 h-80 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(46,139,87,.35), transparent 70%)" }} />

          <div className="relative">
            {/* Breadcrumb */}
            <nav className="text-xs text-white/70 mb-6 flex items-center gap-1.5">
              <Link href="/" className="hover:text-white transition-colors">Início</Link>
              <span className="opacity-50">/</span>
              <span>{bairroLabel}</span>
              <span className="opacity-50">/</span>
              <span className="font-medium text-white">{category.name}</span>
            </nav>

            {/* Ícone + kicker */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-flora-soft" strokeWidth={1.8} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-flora-soft/90">Guia do Jardim Botânico</span>
            </div>

            {/* Título */}
            <h1 className="font-serif text-3xl sm:text-[2.6rem] leading-[1.05] font-semibold">
              {category.name} <span className="italic text-flora-gold">no Jardim Botânico</span>
            </h1>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-flora-soft" />
                {businesses.length} {businesses.length === 1 ? "estabelecimento" : "estabelecimentos"}
              </span>
              {avgRating && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-flora-gold text-flora-gold" />
                    <span className="font-semibold text-white">{avgRating}</span> de média
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Lista */}
        <div className="mt-7">
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
        </div>
      </main>
    </>
  )
}
