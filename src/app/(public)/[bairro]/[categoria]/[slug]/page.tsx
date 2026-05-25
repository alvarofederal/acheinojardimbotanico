import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/prisma"
import { slugify, SITE_URL } from "@/lib/utils"
import Link from "next/link"
import { MapPin, Phone, Globe, Instagram, Facebook, Linkedin, Youtube, Star, Clock, Navigation } from "lucide-react"
import { TrackView } from "./_components/track-view"
import { WhatsAppButton } from "./_components/whatsapp-button"
import { ClaimBanner } from "./_components/claim-banner"
import { ProductShowcase } from "./_components/product-showcase"
import { PhotoGallery } from "./_components/photo-gallery"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ bairro: string; categoria: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const business = await db.business.findUnique({
    where: { slug },
    include: { category: true },
  })
  if (!business) return {}

  const canonical = `${SITE_URL}/${slugify(business.neighborhood)}/${business.category.slug}/${business.slug}`

  return {
    title: `${business.name} — ${business.category.name} em ${business.neighborhood}`,
    description: business.description ?? `${business.name} — ${business.category.name} no ${business.neighborhood}, ${business.city}. Endereço, telefone e horários de funcionamento.`,
    alternates: { canonical },
    openGraph: {
      title: business.name,
      description: business.description ?? undefined,
      type: "website",
      url: canonical,
    },
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

function getWeekdayDescriptions(openingHours: unknown): string[] {
  try {
    const h = openingHours as { weekdayDescriptions?: string[] }
    return h?.weekdayDescriptions ?? []
  } catch { return [] }
}

export default async function BusinessPage({ params }: PageProps) {
  const { bairro, categoria, slug } = await params

  const business = await db.business.findUnique({
    where: { slug },
    include: {
      category: true,
      photos: { orderBy: { order: "asc" }, take: 10 },
      products: { where: { active: true }, orderBy: { order: "asc" } },
    },
  })

  if (!business) notFound()
  if (business.status === "SUSPENDED") notFound()

  const weekdays = getWeekdayDescriptions(business.openingHours)
  const reviews = getReviews(business.reviews)

  const showcaseProducts = business.products.map(p => ({
    id: p.id, name: p.name, description: p.description, categoria: p.categoria,
    priceMode: p.priceMode as "FIXED" | "FROM" | "ON_REQUEST", priceCents: p.priceCents, promoPriceCents: p.promoPriceCents,
    images: Array.isArray(p.images) ? (p.images as unknown as string[]) : [],
    variations: Array.isArray(p.variations) ? (p.variations as unknown as { nome: string; opcoes: string[] }[]) : [],
    soldOut: p.soldOut,
  }))
  const businessUrl = `${SITE_URL}/${slugify(business.neighborhood)}/${business.category.slug}/${business.slug}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.city,
      addressRegion: business.state,
      addressCountry: "BR",
    },
    geo: { "@type": "GeoCoordinates", latitude: business.latitude, longitude: business.longitude },
    telephone: business.phone ?? undefined,
    url: business.website ?? undefined,
    aggregateRating: business.googleRating ? {
      "@type": "AggregateRating",
      ratingValue: business.googleRating,
      reviewCount: business.googleRatingCount ?? 1,
    } : undefined,
  }

  // "Como chegar" → rota até o local exato. Usa o Place ID do Google quando
  // disponível (precisão máxima); senão cai em nome+endereço; por fim lat/lng.
  const destinationText = encodeURIComponent(`${business.name}, ${business.address}`)
  const mapsUrl = business.placeId
    ? `https://www.google.com/maps/dir/?api=1&destination=${destinationText}&destination_place_id=${business.placeId}`
    : `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView businessId={business.id} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs flora-muted mb-5 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">Início</Link>
          <span className="opacity-50">/</span>
          <Link href={`/${bairro}/${categoria}`} className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">
            {business.category.name}
          </Link>
          <span className="opacity-50">/</span>
          <span className="flora-ink truncate max-w-[200px]">{business.name}</span>
        </nav>

        {/* Fotos — galeria editorial com lightbox */}
        <PhotoGallery photos={business.photos.map(p => p.url)} name={business.name} />

        {/* Header */}
        <div className="mb-6 flora-rise">
          <div className="flex items-start gap-3 flex-wrap">
            <p className="text-xs font-medium uppercase tracking-wider text-flora-green dark:text-flora-fresh">{business.category.name}</p>
            {business.plan === "PREMIUM" && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-flora-gold text-flora-ink uppercase tracking-wide">Premium</span>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink leading-tight mt-1.5">
            {business.name}
          </h1>
          {business.googleRating && (
            <span className="inline-flex items-center gap-1.5 text-sm mt-2.5">
              <Star className="w-4 h-4 fill-flora-gold text-flora-gold" />
              <span className="font-semibold flora-ink">{business.googleRating.toFixed(1)}</span>
              {business.googleRatingCount && (
                <span className="flora-muted text-xs">· {business.googleRatingCount} avaliações no Google</span>
              )}
            </span>
          )}
        </div>

        {/* CTAs principais — maiores, mais visíveis */}
        <div className="flex flex-wrap gap-3 mb-6">
          {business.whatsapp && (
            <WhatsAppButton businessId={business.id} whatsapp={business.whatsapp} name={business.name} />
          )}
          {business.phone && (
            <a href={`tel:${business.phone}`}
              className="flex items-center gap-2 px-5 py-3 rounded-full flora-chip text-sm font-semibold flora-ink transition-all">
              <Phone className="w-4 h-4 text-flora-green" />
              {business.phone}
            </a>
          )}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-full flora-chip text-sm font-semibold flora-ink transition-all">
            <Navigation className="w-4 h-4 text-flora-green" />
            Como chegar
          </a>
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-full flora-chip text-sm font-semibold flora-ink transition-all">
              <Globe className="w-4 h-4 text-flora-green" />
              Site
            </a>
          )}
        </div>

        {/* Redes sociais — centraliza a visão do negócio */}
        {(business.instagram || business.facebook || business.linkedin || business.youtube) && (
          <div className="flex flex-wrap items-center gap-2.5 mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider flora-muted">Redes</span>
            {business.instagram && (
              <a href={`https://instagram.com/${business.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex items-center justify-center w-11 h-11 rounded-full flora-chip text-flora-green hover:text-flora-fresh transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {business.facebook && (
              <a href={business.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="flex items-center justify-center w-11 h-11 rounded-full flora-chip text-flora-green hover:text-flora-fresh transition-all">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {business.linkedin && (
              <a href={business.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="flex items-center justify-center w-11 h-11 rounded-full flora-chip text-flora-green hover:text-flora-fresh transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {business.youtube && (
              <a href={business.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                className="flex items-center justify-center w-11 h-11 rounded-full flora-chip text-flora-green hover:text-flora-fresh transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            )}
          </div>
        )}

        {/* Descrição */}
        {business.description && (
          <div className="mb-8 flora-card rounded-3xl p-6">
            <p className="font-serif text-lg flora-ink leading-relaxed italic">“{business.description}”</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Endereço */}
          <div className="flora-card rounded-3xl p-6 space-y-3">
            <h2 className="font-semibold flora-ink text-sm uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-5 h-5 text-flora-green" /> Localização
            </h2>
            <p className="text-base flora-muted leading-relaxed">{business.address}</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-flora-green dark:text-flora-fresh hover:gap-2.5 transition-all">
              <Navigation className="w-4 h-4" /> Ver rota
            </a>
          </div>

          {/* Horários */}
          {weekdays.length > 0 && (
            <div className="flora-card rounded-3xl p-6 space-y-3">
              <h2 className="font-semibold flora-ink text-sm uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-5 h-5 text-flora-green" /> Horários
              </h2>
              <ul className="text-base flora-muted space-y-1.5">
                {weekdays.map((day, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span className="opacity-70">{day.split(":")[0]}</span>
                    <span className="text-right flora-ink">{day.split(":").slice(1).join(":").trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Vitrine de produtos */}
        {showcaseProducts.length > 0 && (
          <ProductShowcase
            products={showcaseProducts}
            businessId={business.id}
            whatsapp={business.whatsapp}
            storeMessage={business.storeWhatsappMessage}
            businessUrl={businessUrl}
            storeHref={`/${bairro}/${categoria}/${slug}/loja`}
          />
        )}

        {/* Avaliações do Google */}
        {reviews.length > 0 && (
          <div className="mt-10">
            <h2 className="font-serif text-2xl font-semibold flora-ink mb-5 flex items-center gap-2">
              <Star className="w-5 h-5 fill-flora-gold text-flora-gold" />
              O que dizem no Google
            </h2>
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
                    {r.authorAttribution?.photoUri ? (
                      <img src={r.authorAttribution.photoUri} alt="" className="w-7 h-7 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-flora-green/15 flex items-center justify-center text-flora-green text-xs font-bold">
                        {(r.authorAttribution?.displayName ?? "?")[0]}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold flora-ink truncate">{r.authorAttribution?.displayName ?? "Visitante"}</p>
                      {r.relativePublishTimeDescription && (
                        <p className="text-[11px] flora-muted">{r.relativePublishTimeDescription}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claim banner */}
        {!business.ownerId && <ClaimBanner businessId={business.id} businessName={business.name} />}

        {/* Atribuição obrigatória — Google Places TOS */}
        {(business.googleRating || business.photos.some(p => p.source === "GOOGLE_PLACES")) && (
          <p className="mt-8 text-xs text-gray-300 dark:text-white/20 text-center">
            Algumas informações e fotos fornecidas por Google
          </p>
        )}
      </main>
    </>
  )
}
