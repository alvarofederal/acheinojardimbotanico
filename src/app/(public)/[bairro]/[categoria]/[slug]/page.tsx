import { notFound } from "next/navigation"
import { headers } from "next/headers"
import type { Metadata } from "next"
import { db } from "@/lib/prisma"
import Link from "next/link"
import { MapPin, Phone, Globe, Instagram, Star, Clock, MessageCircle, Navigation } from "lucide-react"
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

  return {
    title: `${business.name} — ${business.category.name} em ${business.neighborhood}`,
    description: business.description ?? `${business.name} — ${business.category.name} no ${business.neighborhood}, ${business.city}. Endereço, telefone e horários de funcionamento.`,
    openGraph: {
      title: business.name,
      description: business.description ?? undefined,
      type: "website",
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

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView businessId={business.id} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 dark:text-white/30 mb-5 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Início</Link>
          <span>/</span>
          <Link href={`/${bairro}/${categoria}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors capitalize">
            {business.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-600 dark:text-white/60 truncate max-w-[200px]">{business.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex-1">
              {business.name}
            </h1>
            {business.plan === "PREMIUM" && (
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 uppercase tracking-wide">Premium</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-white/40 capitalize">{business.category.name}</span>
            {business.googleRating && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-800 dark:text-white/80">{business.googleRating.toFixed(1)}</span>
                {business.googleRatingCount && (
                  <span className="text-gray-400 dark:text-white/30 text-xs">({business.googleRatingCount} avaliações)</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Fotos */}
        {business.photos.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {business.photos.slice(0, 4).map((photo, i) => (
              <div key={photo.id} className={`rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                <img src={photo.url} alt={`${business.name} - foto ${i + 1}`} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
              </div>
            ))}
          </div>
        )}

        {/* CTAs principais */}
        <div className="flex flex-wrap gap-3 mb-8">
          {business.whatsapp && (
            <WhatsAppButton businessId={business.id} whatsapp={business.whatsapp} name={business.name} />
          )}
          {business.phone && (
            <a href={`tel:${business.phone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <Phone className="w-4 h-4" />
              {business.phone}
            </a>
          )}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Navigation className="w-4 h-4" />
            Como chegar
          </a>
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <Globe className="w-4 h-4" />
              Site
            </a>
          )}
          {business.instagram && (
            <a href={`https://instagram.com/${business.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Endereço */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Localização</h2>
            <p className="text-sm text-gray-600 dark:text-white/60 flex gap-2">
              <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              {business.address}
            </p>
          </div>

          {/* Horários */}
          {weekdays.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Horários
              </h2>
              <ul className="text-sm text-gray-600 dark:text-white/60 space-y-1">
                {weekdays.map((day, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span className="text-gray-400 dark:text-white/30">{day.split(":")[0]}</span>
                    <span className="text-right">{day.split(":").slice(1).join(":").trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Descrição */}
        {business.description && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/[0.06]">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-3">Sobre</h2>
            <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">{business.description}</p>
          </div>
        )}

        {/* Claim banner */}
        {!business.ownerId && <ClaimBanner businessId={business.id} businessName={business.name} />}
      </main>
    </>
  )
}
