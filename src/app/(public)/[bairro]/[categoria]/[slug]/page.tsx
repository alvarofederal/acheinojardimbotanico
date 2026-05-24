import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/prisma"
import { slugify, SITE_URL } from "@/lib/utils"
import Link from "next/link"
import { MapPin, Phone, Globe, Instagram, Star, Clock, Navigation } from "lucide-react"
import { TrackView } from "./_components/track-view"
import { WhatsAppButton } from "./_components/whatsapp-button"
import { ClaimBanner } from "./_components/claim-banner"

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
    },
  })

  if (!business) notFound()
  if (business.status === "SUSPENDED") notFound()

  const weekdays = getWeekdayDescriptions(business.openingHours)

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

        {/* Fotos — galeria editorial */}
        {business.photos.length > 0 && (
          <div className="mb-7 grid grid-cols-4 grid-rows-2 gap-2 rounded-3xl overflow-hidden flora-rise" style={{ height: "min(60vw, 380px)" }}>
            {business.photos.slice(0, 3).map((photo, i) => (
              <div key={photo.id} className={`overflow-hidden bg-flora-sand dark:bg-white/5 ${i === 0 ? "col-span-4 sm:col-span-2 row-span-2" : "col-span-2 sm:col-span-2"}`}>
                <img src={photo.url} alt={`${business.name} - foto ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  loading={i === 0 ? "eager" : "lazy"} />
              </div>
            ))}
          </div>
        )}

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

        {/* CTAs principais */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {business.whatsapp && (
            <WhatsAppButton businessId={business.id} whatsapp={business.whatsapp} name={business.name} />
          )}
          {business.phone && (
            <a href={`tel:${business.phone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full flora-chip text-sm font-medium flora-ink transition-all">
              <Phone className="w-4 h-4 text-flora-green" />
              {business.phone}
            </a>
          )}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-full flora-chip text-sm font-medium flora-ink transition-all">
            <Navigation className="w-4 h-4 text-flora-green" />
            Como chegar
          </a>
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full flora-chip text-sm font-medium flora-ink transition-all">
              <Globe className="w-4 h-4 text-flora-green" />
              Site
            </a>
          )}
          {business.instagram && (
            <a href={`https://instagram.com/${business.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full flora-chip text-sm font-medium flora-ink transition-all">
              <Instagram className="w-4 h-4 text-flora-green" />
              Instagram
            </a>
          )}
        </div>

        {/* Descrição */}
        {business.description && (
          <div className="mb-8 flora-card rounded-3xl p-6">
            <p className="font-serif text-lg flora-ink leading-relaxed italic">“{business.description}”</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Endereço */}
          <div className="flora-card rounded-2xl p-5 space-y-2">
            <h2 className="font-semibold flora-ink text-xs uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-flora-green" /> Localização
            </h2>
            <p className="text-sm flora-muted leading-relaxed">{business.address}</p>
          </div>

          {/* Horários */}
          {weekdays.length > 0 && (
            <div className="flora-card rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold flora-ink text-xs uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-flora-green" /> Horários
              </h2>
              <ul className="text-sm flora-muted space-y-1">
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
