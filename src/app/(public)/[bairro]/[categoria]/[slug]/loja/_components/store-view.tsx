import { cache } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/prisma"
import { profilePath, lojaUrl } from "@/lib/links"
import { getPlanConfig } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { StoreFront, type StoreProduct } from "./storefront"
import { FloatingWhatsApp } from "./floating-whatsapp"
import { ArrowLeft, Star, MapPin, BadgeCheck, ShoppingBag } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"

/** Carrega a loja (por slug OU handle), em React cache. */
export const loadStore = cache(async (where: { slug: string } | { handle: string }) => {
  return db.business.findUnique({
    where,
    include: {
      category: true,
      photos: { orderBy: { order: "asc" }, take: 1 },
      products: { where: { active: true }, orderBy: [{ featured: "desc" }, { order: "asc" }] },
    },
  })
})

export type StoreBusiness = NonNullable<Awaited<ReturnType<typeof loadStore>>>

/** Metadados da loja — canonical na URL curta (handle)/loja. */
export function buildStoreMetadata(business: StoreBusiness): Metadata {
  const canonical = lojaUrl(business)
  return {
    title: `Loja de ${business.name}`,
    description: business.storeTagline ?? `Produtos de ${business.name} — compre pelo WhatsApp, no Achei no Jardim Botânico.`,
    alternates: { canonical },
    openGraph: { title: `Loja de ${business.name}`, url: canonical, images: business.storeCoverUrl ? [business.storeCoverUrl] : undefined },
  }
}

interface PlaceReview {
  rating?: number
  text?: { text: string }
  relativePublishTimeDescription?: string
  authorAttribution?: { displayName?: string; photoUri?: string }
}
function getReviews(reviews: unknown): PlaceReview[] {
  if (!Array.isArray(reviews)) return []
  return (reviews as PlaceReview[]).filter(r => r?.text?.text).slice(0, 3)
}

/**
 * Loja pública — renderizada IN-PLACE em /{handle}/loja (e como fallback, sem
 * handle, na URL longa). Plano sem "loja" → o chamador deve dar notFound().
 * Retorna null se o plano não tem loja (defesa extra).
 */
export async function StoreView({ business }: { business: StoreBusiness }) {
  const planCfg = await getPlanConfig(business.plan as PlanId)
  if (!planCfg.features.loja) return null
  const canPromo = planCfg.features.promocoes

  const products: StoreProduct[] = business.products.map(p => ({
    id: p.id, name: p.name, description: p.description, categoria: p.categoria,
    priceMode: p.priceMode as StoreProduct["priceMode"], priceCents: p.priceCents,
    promoPriceCents: canPromo ? p.promoPriceCents : null,
    images: Array.isArray(p.images) ? (p.images as unknown as string[]) : [],
    variations: Array.isArray(p.variations) ? (p.variations as unknown as { nome: string; opcoes: string[] }[]) : [],
    soldOut: p.soldOut,
    featured: p.featured,
  }))

  const reviews = getReviews(business.reviews)
  const profileHref = profilePath(business)
  const businessUrl = lojaUrl(business)
  const showSelo = planCfg.features.selo
  const cover = business.storeCoverUrl || business.photos[0]?.url
  const coverPos = business.storeCoverPos || "50% 50%"
  const tagline = business.storeTagline || business.description
  const mapsUrl = business.placeId
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${business.name}, ${business.address}`)}&destination_place_id=${business.placeId}`
    : `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`

  return (
    <main className="pb-24">
      {/* HERO cinematográfico */}
      <section className="relative">
        <div className="relative h-[44vh] min-h-[320px] max-h-[480px] w-full overflow-hidden bg-flora-deep">
          {cover
            ? <img src={cover} alt={business.name} style={{ objectPosition: coverPos }} className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0 flora-hero" />}
          {/* Gradiente para legibilidade */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,28,24,0.92) 0%, rgba(15,28,24,0.45) 45%, rgba(15,28,24,0.15) 100%)" }} />

          {/* Voltar */}
          <Link href={profileHref} className="absolute top-5 left-4 sm:left-6 inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <ArrowLeft className="w-4 h-4" /> Perfil
          </Link>

          {/* Conteúdo do hero */}
          <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-4 sm:px-6 pb-7">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/80 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <ShoppingBag className="w-3 h-3 text-flora-gold" /> Loja
              </span>
              {showSelo && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-600 text-white uppercase tracking-wide shadow-sm">
                  <BadgeCheck className="w-3 h-3" /> Verificado
                </span>
              )}
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-white leading-[1.05] tracking-tight">{business.name}</h1>
            {tagline && <p className="mt-3 text-white/85 text-base sm:text-lg max-w-2xl leading-relaxed">{tagline}</p>}

            <div className="flex items-center gap-4 mt-4 flex-wrap text-sm text-white/75">
              <span>{business.category.name}</span>
              {business.googleRating && (
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-flora-gold text-flora-gold" />{business.googleRating.toFixed(1)}{business.googleRatingCount ? ` (${business.googleRatingCount})` : ""}</span>
              )}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                <MapPin className="w-3.5 h-3.5" />{business.neighborhood}
              </a>
              <span>· {products.length} {products.length === 1 ? "produto" : "produtos"}</span>
            </div>

            {business.whatsapp && (
              <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-full bg-flora-green hover:bg-flora-fresh text-white text-sm font-semibold shadow-xl shadow-flora-green/30 hover:-translate-y-0.5 transition-all">
                <WhatsappIcon className="w-4 h-4" /> Falar com a loja
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Produtos por seção */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-flora-green/30 mx-auto mb-3" />
            <p className="font-serif text-xl flora-ink">Esta loja ainda não tem produtos</p>
          </div>
        ) : (
          <StoreFront
            products={products}
            businessId={business.id}
            whatsapp={business.whatsapp}
            storeMessage={business.storeWhatsappMessage}
            businessUrl={businessUrl}
          />
        )}

        {/* Avaliações do Google — prova social */}
        {reviews.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 fill-flora-gold text-flora-gold" />
              <h2 className="font-serif text-2xl font-semibold flora-ink">O que dizem no Google</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {reviews.map((r, i) => (
                <div key={i} className="flora-card rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s < Math.round(r.rating ?? 0) ? "fill-flora-gold text-flora-gold" : "text-flora-soft/40"}`} />
                    ))}
                  </div>
                  <p className="text-sm flora-muted leading-relaxed line-clamp-5 flex-1">“{r.text?.text}”</p>
                  <div className="flex items-center gap-2 pt-1">
                    {r.authorAttribution?.photoUri
                      ? <img src={r.authorAttribution.photoUri} alt="" className="w-7 h-7 rounded-full object-cover" loading="lazy" />
                      : <span className="w-7 h-7 rounded-full bg-flora-green/15 flex items-center justify-center text-flora-green text-xs font-bold">{(r.authorAttribution?.displayName ?? "?")[0]}</span>}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold flora-ink truncate">{r.authorAttribution?.displayName ?? "Visitante"}</p>
                      {r.relativePublishTimeDescription && <p className="text-[11px] flora-muted">{r.relativePublishTimeDescription}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-300 dark:text-white/20">Avaliações fornecidas por Google</p>
          </section>
        )}
      </div>

      {/* WhatsApp flutuante */}
      {business.whatsapp && (
        <FloatingWhatsApp
          businessId={business.id}
          whatsapp={business.whatsapp}
          storeMessage={business.storeWhatsappMessage}
          businessUrl={businessUrl}
        />
      )}
    </main>
  )
}
