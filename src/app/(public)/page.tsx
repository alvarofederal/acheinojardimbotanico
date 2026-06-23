import Link from "next/link"
import { db } from "@/lib/prisma"
import { profilePath } from "@/lib/links"
import { getCategoryIcon } from "@/lib/category-icons"
import { HeroSearch } from "./_components/hero-search"
import { MonsteraLeaf, LeafSprig, FernFrond, SimpleLeaf } from "./_components/botanicals"
import { HeroParallax } from "./_components/hero-parallax"
import { ArrowRight, Sparkles, Star, MapPin, ChevronDown } from "lucide-react"
import { FavoriteHeart } from "@/components/favorite-heart"
import { FavoritosStrip } from "@/components/favoritos-strip"
import { WhatsappIcon } from "@/components/whatsapp-icon"

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
        id: true, slug: true, handle: true, name: true, neighborhood: true, googleRating: true, googleRatingCount: true, whatsapp: true,
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
      {/* ═══════════ HERO CINEMATOGRÁFICO — verde cobre a tela inteira (100svh), conteúdo centrado ═══════════ */}
      <section className="relative flora-hero overflow-hidden -mt-16 min-h-[100svh] flex flex-col items-center justify-center">
        {/* Camada botânica + brilhos — com parallax de mouse e scroll */}
        <HeroParallax />

        {/* Textura pontilhada (grain) — igual ao estudo */}
        <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "4px 4px" }} />

        {/* Brilho dourado superior */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-flora-gold/10 to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full bg-white/10 text-white/90 backdrop-blur-sm border border-white/15 mb-7 flora-rise">
            <MapPin className="w-3 h-3" />
            Bairro Jardim Botânico · Brasília (DF)
          </span>

          <h1 className="font-serif font-semibold leading-[1.05] tracking-tight flora-rise" style={{ animationDelay: ".05s" }}>
            <span style={{ color: "#FB923C", fontSize: "clamp(1.5rem, 4vw, 2.7rem)" }}>Achou?</span>
            {/* SVG: "Achei no Jardim Botânico" sempre em UMA linha, escala com a tela (mesma cara no celular) */}
            <svg viewBox="0 0 1080 132" width="100%" preserveAspectRatio="xMidYMid meet"
              role="img" aria-label="Achei no Jardim Botânico"
              style={{ display: "block", margin: "0.1em auto 0", maxWidth: "880px" }}>
              <text x="540" y="100" textAnchor="middle" textLength={1040} lengthAdjust="spacingAndGlyphs"
                fontFamily="'Playfair Display', Georgia, serif" fontWeight={700} fontSize={96}>
                <tspan fill="#ffffff">Achei no </tspan><tspan fill="#D2B48C" fontStyle="italic">Jardim Botânico</tspan>
              </text>
            </svg>
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
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink mt-2">Explore por <span className="italic text-flora-gold">categoria</span></h2>
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
                  className="flora-card group rounded-2xl p-5 flex flex-col items-center text-center gap-2.5 flora-rise hover:!border-flora-gold/60"
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

      {/* ═══════════ SEUS FAVORITOS (cookie, client-side) ═══════════ */}
      <FavoritosStrip />

      {/* ═══════════ DESTAQUES (Joias) — cards editoriais que revelam ao passar o mouse ═══════════ */}
      {topRated.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-flora-fresh">
              <Sparkles className="w-3.5 h-3.5" /> Joias do bairro
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink mt-2">
              Bem <span className="italic text-flora-gold">avaliadas</span>
            </h2>
            <p className="flora-muted text-sm mt-2">Os lugares que a vizinhança ama — passe o mouse e descubra.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topRated.map((b, i) => {
              const href = profilePath(b)
              return (
                <article key={b.id}
                  className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-lg shadow-flora-deep/15 flora-rise transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-flora-deep/30"
                  style={{ animationDelay: `${i * 0.05}s` }}>
                  {/* Foto de fundo */}
                  {b.photos[0]?.url ? (
                    <img src={b.photos[0].url} alt={b.name} loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-flora-green to-flora-deep flex items-center justify-center overflow-hidden">
                      <MonsteraLeaf className="absolute -right-6 -bottom-6 w-44 h-44 text-white/10" />
                      <span className="font-serif text-6xl text-white/70">{b.name[0]}</span>
                    </div>
                  )}
                  {/* Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-flora-deep/95 via-flora-deep/35 to-transparent" />
                  {/* Anel dourado no hover */}
                  <div className="absolute inset-0 rounded-3xl border-[1.5px] border-transparent group-hover:border-flora-gold/80 transition-colors duration-500 pointer-events-none z-20" />

                  {/* Link cobrindo o card (clique → perfil) */}
                  <Link href={href} className="absolute inset-0 z-10" aria-label={`Ver ${b.name}`} />

                  {/* Coração (clique isolado) */}
                  <FavoriteHeart item={{ id: b.id, name: b.name, href, photo: b.photos[0]?.url ?? null }} />

                  {/* Nota */}
                  {b.googleRating && (
                    <span className="absolute top-3 right-3 z-20 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/92 text-flora-ink shadow-sm">
                      <Star className="w-3 h-3 fill-flora-gold text-flora-gold" />
                      {b.googleRating.toFixed(1)}
                    </span>
                  )}

                  {/* Conteúdo embaixo */}
                  <div className="absolute inset-x-0 bottom-0 z-20 p-5 pointer-events-none">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-flora-deep bg-flora-gold/95 px-2.5 py-1 rounded-full mb-2">
                      {b.category.name}
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-white leading-tight" style={{ textShadow: "0 2px 14px rgba(0,0,0,.45)" }}>
                      {b.name}
                    </h3>
                    {/* Revelação: a informação sobe no hover */}
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-out">
                      <div className="overflow-hidden">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          <p className="text-[13px] text-white/85 leading-relaxed mt-2.5">
                            {b.googleRatingCount ? `${b.googleRatingCount} avaliações no Google` : "Recém-chegado ao guia"} · {b.neighborhood}
                          </p>
                          {b.whatsapp ? (
                            <a href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                              className="pointer-events-auto inline-flex items-center gap-2 mt-3 bg-[#25a35a] hover:bg-[#1f8f4e] text-white text-[13px] font-semibold px-4 py-2 rounded-full transition-all hover:scale-105">
                              <WhatsappIcon className="w-4 h-4" /> Falar no WhatsApp
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 mt-3 text-flora-gold text-[13px] font-semibold">
                              Ver perfil <ArrowRight className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════ CTA ANUNCIANTE ═══════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] flora-hero p-10 sm:p-16 text-center">
          <MonsteraLeaf className="absolute -top-8 -right-8 w-44 h-44 text-flora-fresh/20 flora-wind" />
          <LeafSprig className="absolute -bottom-4 left-4 w-24 h-56 text-flora-soft/20 flora-wind hidden sm:block" style={{ animationDelay: "2s" }} />
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
