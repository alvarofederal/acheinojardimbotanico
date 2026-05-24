import Link from "next/link"
import { db } from "@/lib/prisma"
import { getCategoryIcon } from "@/lib/category-icons"
import { HeroSearch } from "./_components/hero-search"
import { Leaf, ArrowRight, MapPin, Sparkles, Star } from "lucide-react"

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
      where: { status: { in: ["IMPORTED", "CLAIMED"] }, googleRating: { gte: 4.5 }, photos: { some: {} } },
      select: {
        id: true, slug: true, name: true, neighborhood: true, googleRating: true,
        category: { select: { slug: true, name: true } },
        photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
      },
      orderBy: [{ googleRatingCount: "desc" }],
      take: 6,
    }),
  ])

  return (
    <main>
      {/* ───────── HERO ───────── */}
      <section className="relative flora-hero overflow-hidden">
        {/* Folhas decorativas */}
        <Leaf className="absolute top-12 left-[8%] w-16 h-16 text-white/[0.06] flora-sway" strokeWidth={1} />
        <Leaf className="absolute bottom-16 right-[10%] w-24 h-24 text-white/[0.05] flora-sway" strokeWidth={1} style={{ animationDelay: "1.5s" }} />
        <Leaf className="absolute top-1/3 right-[20%] w-10 h-10 text-white/[0.07] flora-sway" strokeWidth={1} style={{ animationDelay: "3s" }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 text-white/90 backdrop-blur-sm border border-white/15 mb-6 flora-rise">
            <MapPin className="w-3 h-3" />
            Jardim Botânico · Brasília (DF)
          </span>

          <h1 className="font-serif text-4xl sm:text-6xl font-semibold text-white leading-[1.05] tracking-tight flora-rise" style={{ animationDelay: ".05s" }}>
            Tudo que o bairro<br />
            <span className="italic text-flora-gold">tem de melhor</span>, perto de você
          </h1>

          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-xl mx-auto flora-rise" style={{ animationDelay: ".1s" }}>
            Restaurantes, serviços, saúde e beleza. O guia comercial completo
            e cuidadosamente curado do Jardim Botânico.
          </p>

          <div className="mt-9 flora-rise" style={{ animationDelay: ".15s" }}>
            <HeroSearch />
          </div>

          {totalBusinesses > 0 && (
            <p className="mt-5 text-sm text-white/55 flora-rise" style={{ animationDelay: ".2s" }}>
              <span className="font-semibold text-white/80">{totalBusinesses}</span> estabelecimentos já no guia
            </p>
          )}
        </div>

        {/* Onda orgânica de transição */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ height: "48px" }}>
          <path d="M0,40 C360,80 720,0 1080,30 C1260,45 1380,40 1440,35 L1440,80 L0,80 Z" className="fill-flora-cream dark:fill-flora-deep" />
        </svg>
      </section>

      {/* ───────── CATEGORIAS ───────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink">Explore por categoria</h2>
            <p className="flora-muted text-sm mt-1">Escolha o que procura e descubra o melhor da região</p>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16">
            <Leaf className="w-12 h-12 text-flora-green/30 mx-auto mb-4" />
            <p className="font-serif text-xl flora-ink mb-1">Cultivando o guia</p>
            <p className="text-sm flora-muted">Em breve os melhores negócios da região florescerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat, i) => {
              const Icon = getCategoryIcon(cat.slug)
              return (
                <Link
                  key={cat.slug}
                  href={`/${DEFAULT_BAIRRO}/${cat.slug}`}
                  className="flora-card group rounded-2xl p-4 flex flex-col items-center text-center gap-2 flora-rise"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-flora-green/[0.08] dark:bg-flora-fresh/15 group-hover:bg-flora-green/15 group-hover:scale-110 transition-all">
                    <Icon className="w-5 h-5 text-flora-green dark:text-flora-fresh" strokeWidth={1.8} />
                  </span>
                  <span className="text-sm font-semibold flora-ink leading-tight">{cat.name}</span>
                  <span className="text-xs flora-muted">{cat._count.businesses} {cat._count.businesses === 1 ? "local" : "locais"}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ───────── DESTAQUES ───────── */}
      {topRated.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-5 h-5 text-flora-gold" />
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink">Bem avaliados na região</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topRated.map((b, i) => (
              <Link
                key={b.id}
                href={`/${DEFAULT_BAIRRO}/${b.category.slug}/${b.slug}`}
                className="flora-card group rounded-3xl overflow-hidden flora-rise"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-flora-sand">
                  <img src={b.photos[0]?.url} alt={b.name} loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {b.googleRating && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white/90 text-flora-ink backdrop-blur-md shadow-sm">
                      <Star className="w-3 h-3 fill-flora-gold text-flora-gold" />
                      {b.googleRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs flora-muted uppercase tracking-wide">{b.category.name}</p>
                  <h3 className="font-serif text-lg font-semibold flora-ink leading-tight mt-0.5 group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors line-clamp-1">
                    {b.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───────── CTA ANUNCIANTE ───────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] flora-hero p-10 sm:p-14 text-center">
          <Leaf className="absolute -top-4 -right-4 w-32 h-32 text-white/[0.06] flora-sway" strokeWidth={0.8} />
          <h2 className="relative font-serif text-3xl sm:text-4xl font-semibold text-white">
            Seu negócio merece ser <span className="italic text-flora-gold">encontrado</span>
          </h2>
          <p className="relative mt-3 text-white/75 max-w-md mx-auto">
            Apareça para quem mora e circula pelo Jardim Botânico todos os dias.
          </p>
          <Link href="/register"
            className="relative inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full bg-white text-flora-green font-semibold text-sm hover:bg-flora-gold hover:text-flora-ink transition-all hover:shadow-xl">
            Cadastrar meu negócio
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
