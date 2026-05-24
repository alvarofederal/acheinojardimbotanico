import Link from "next/link"
import { db } from "@/lib/prisma"
import { getCategoryIcon } from "@/lib/category-icons"
import { HeroSearch } from "./_components/hero-search"
import { MonsteraLeaf, LeafSprig, FernFrond, SimpleLeaf } from "./_components/botanicals"
import { ArrowRight, Sparkles, Star, MapPin, ChevronDown } from "lucide-react"

export const revalidate = 3600

const DEFAULT_BAIRRO = "jardim-botanico"

export default async function HomePage() {
  const [categories, totalBusinesses, topRated] = await Promise.all([
    db.category.findMany({
      where: { businesses: { some: { status: { in: ["IMPORTED", "CLAIMED"] } } } },
      select: { slug: true, name: true, _count: { select: { businesses: true } } },
      orderBy: { businesses: { _count: "desc" } },
      take: 18,
    }),
    db.business.count({ where: { status: { in: ["IMPORTED", "CLAIMED"] } } }),
    db.business.findMany({
      where: { status: { in: ["IMPORTED", "CLAIMED"] }, googleRating: { gte: 4.5 } },
      select: {
        id: true, slug: true, name: true, neighborhood: true, googleRating: true, googleRatingCount: true,
        category: { select: { slug: true, name: true } },
        photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
      },
      orderBy: [{ googleRatingCount: "desc" }],
      take: 6,
    }),
  ])

  const quickChips = categories.slice(0, 6)

  return (
    <main>
      {/* ═══════════ HERO CINEMATOGRÁFICO ═══════════ */}
      <section className="relative flora-hero overflow-hidden">
        {/* Camada botânica — profundidade */}
        <MonsteraLeaf className="absolute -left-16 -top-10 w-72 h-72 text-flora-fresh/25 flora-sway" style={{ animationDuration: "9s" }} />
        <MonsteraLeaf className="absolute -right-20 top-24 w-96 h-96 text-flora-green/30 flora-sway" style={{ animationDuration: "11s", animationDelay: "2s" }} />
        <LeafSprig className="absolute right-[12%] -top-6 w-28 h-72 text-flora-soft/30 flora-sway" style={{ animationDelay: "1s" }} />
        <FernFrond className="absolute left-[8%] bottom-8 w-24 h-64 text-flora-soft/25 flora-sway hidden sm:block" style={{ animationDelay: "3s" }} />
        <SimpleLeaf className="absolute left-[30%] top-[18%] w-8 h-8 text-flora-gold/40 flora-sway" style={{ animationDelay: "1.5s" }} />
        <SimpleLeaf className="absolute right-[28%] bottom-[26%] w-6 h-6 text-flora-soft/40 flora-sway" style={{ animationDelay: "4s" }} />

        {/* Brilho dourado superior */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-flora-gold/10 to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-28 sm:pt-28 sm:pb-36 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-white/10 text-white/90 backdrop-blur-sm border border-white/15 mb-7 flora-rise">
            <MapPin className="w-3 h-3" />
            Bairro Jardim Botânico · Brasília (DF)
          </span>

          <h1 className="font-serif font-semibold text-white leading-[1.02] tracking-tight flora-rise"
            style={{ fontSize: "clamp(2.6rem, 7vw, 4.6rem)", animationDelay: ".05s" }}>
            O melhor do bairro,
            <br />
            <span className="italic text-flora-gold">florescendo</span> em um só lugar
          </h1>

          <p className="mt-6 text-base sm:text-xl text-white/75 max-w-xl mx-auto leading-relaxed flora-rise" style={{ animationDelay: ".1s" }}>
            Restaurantes, serviços, saúde e beleza — cuidadosamente reunidos
            para quem vive e respira o Jardim Botânico.
          </p>

          <div className="mt-10 flora-rise" style={{ animationDelay: ".15s" }}>
            <HeroSearch />
          </div>

          {/* Chips de categoria rápida */}
          {quickChips.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 flora-rise" style={{ animationDelay: ".2s" }}>
              <span className="text-xs text-white/45">Explore:</span>
              {quickChips.map(c => {
                const Icon = getCategoryIcon(c.slug)
                return (
                  <Link key={c.slug} href={`/${DEFAULT_BAIRRO}/${c.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 backdrop-blur-sm transition-all hover:-translate-y-0.5">
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                    {c.name}
                  </Link>
                )
              })}
            </div>
          )}

          {totalBusinesses > 0 && (
            <p className="mt-8 text-sm text-white/50 flora-rise inline-flex items-center gap-2" style={{ animationDelay: ".25s" }}>
              <SimpleLeaf className="w-3.5 h-3.5 text-flora-gold/70" />
              <span className="font-semibold text-white/80">{totalBusinesses}</span> estabelecimentos já no guia
            </p>
          )}

          {/* Cue de scroll */}
          <div className="mt-12 flex justify-center flora-rise" style={{ animationDelay: ".3s" }}>
            <ChevronDown className="w-5 h-5 text-white/40 animate-bounce" />
          </div>
        </div>

        {/* Onda orgânica de transição */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ height: "56px" }}>
          <path d="M0,45 C240,90 480,10 720,35 C960,60 1200,20 1440,40 L1440,90 L0,90 Z" className="fill-flora-cream dark:fill-flora-deep" />
        </svg>
      </section>

      {/* ═══════════ CATEGORIAS ═══════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-flora-fresh">
            <SimpleLeaf className="w-3.5 h-3.5" /> Navegue
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink mt-2">Explore por categoria</h2>
          <p className="flora-muted text-sm mt-2 max-w-md mx-auto">Do café da manhã ao cuidado com a casa — tudo a poucos minutos de você.</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16">
            <FernFrond className="w-16 h-28 text-flora-soft mx-auto mb-4" />
            <p className="font-serif text-xl flora-ink mb-1">Cultivando o guia</p>
            <p className="text-sm flora-muted">Em breve os melhores negócios da região florescerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {categories.map((cat, i) => {
              const Icon = getCategoryIcon(cat.slug)
              return (
                <Link key={cat.slug} href={`/${DEFAULT_BAIRRO}/${cat.slug}`}
                  className="flora-card group rounded-2xl p-5 flex flex-col items-center text-center gap-2.5 flora-rise"
                  style={{ animationDelay: `${i * 0.03}s` }}>
                  <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-flora-green/[0.07] dark:bg-flora-fresh/15 group-hover:bg-flora-green/15 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    <Icon className="w-6 h-6 text-flora-green dark:text-flora-fresh" strokeWidth={1.6} />
                  </span>
                  <span className="text-sm font-semibold flora-ink leading-tight">{cat.name}</span>
                  <span className="text-xs flora-muted">{cat._count.businesses} {cat._count.businesses === 1 ? "local" : "locais"}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ═══════════ DESTAQUES ═══════════ */}
      {topRated.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-5 h-5 text-flora-gold" />
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink">Joias bem avaliadas</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topRated.map((b, i) => (
              <Link key={b.id} href={`/${DEFAULT_BAIRRO}/${b.category.slug}/${b.slug}`}
                className="flora-card group rounded-3xl overflow-hidden flora-rise"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-flora-green/15 to-flora-soft/20">
                  {b.photos[0]?.url ? (
                    <img src={b.photos[0].url} alt={b.name} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                      <MonsteraLeaf className="absolute -right-6 -bottom-6 w-32 h-32 text-flora-green/15" />
                      <span className="font-serif text-5xl text-flora-green/40">{b.name[0]}</span>
                    </div>
                  )}
                  {b.googleRating && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 text-flora-ink backdrop-blur-md shadow-sm">
                      <Star className="w-3 h-3 fill-flora-gold text-flora-gold" />
                      {b.googleRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] flora-muted uppercase tracking-widest">{b.category.name}</p>
                  <h3 className="font-serif text-lg font-semibold flora-ink leading-tight mt-1 group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors line-clamp-1">
                    {b.name}
                  </h3>
                  {b.googleRatingCount && (
                    <p className="text-xs flora-muted mt-1">{b.googleRatingCount} avaliações</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ CTA ANUNCIANTE ═══════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] flora-hero p-10 sm:p-16 text-center">
          <MonsteraLeaf className="absolute -top-8 -right-8 w-44 h-44 text-flora-fresh/20 flora-sway" />
          <LeafSprig className="absolute -bottom-4 left-4 w-24 h-56 text-flora-soft/20 flora-sway hidden sm:block" style={{ animationDelay: "2s" }} />
          <h2 className="relative font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight">
            Seu negócio merece ser <span className="italic text-flora-gold">descoberto</span>
          </h2>
          <p className="relative mt-4 text-white/75 max-w-md mx-auto">
            Apareça para quem mora e circula pelo Jardim Botânico todos os dias. Elegante, simples e local.
          </p>
          <Link href="/register"
            className="relative inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-full bg-white text-flora-green font-semibold text-sm hover:bg-flora-gold hover:text-flora-ink transition-all hover:shadow-2xl hover:-translate-y-0.5">
            Cadastrar meu negócio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
