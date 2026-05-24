"use client"

import Link from "next/link"
import { MapPin, Star, MessageCircle, Clock } from "lucide-react"

interface BusinessCardProps {
  business: {
    id: string
    slug: string
    name: string
    address: string
    neighborhood: string
    googleRating: number | null
    googleRatingCount: number | null
    phone: string | null
    whatsapp: string | null
    plan: string
    photos: Array<{ url: string }>
    openingHours: unknown
  }
  bairro: string
  categoria: string
}

function isOpenNow(openingHours: unknown): boolean | null {
  if (!openingHours) return null
  try {
    const h = openingHours as { periods?: Array<{ open: { day: number; hour: number; minute: number }; close: { day: number; hour: number; minute: number } }> }
    if (!h.periods) return null
    const now = new Date()
    const day = now.getDay()
    const totalMins = now.getHours() * 60 + now.getMinutes()
    const period = h.periods.find(p => p.open.day === day)
    if (!period) return false
    const openMins = period.open.hour * 60 + period.open.minute
    const closeMins = period.close.hour * 60 + period.close.minute
    return totalMins >= openMins && totalMins < closeMins
  } catch { return null }
}

export function BusinessCard({ business, bairro, categoria }: BusinessCardProps) {
  const photo = business.photos[0]?.url
  const open = isOpenNow(business.openingHours)
  const isPremium = business.plan === "PREMIUM"
  const isVisibility = business.plan === "VISIBILITY"

  return (
    <Link
      href={`/${bairro}/${categoria}/${business.slug}`}
      className="flora-card group block rounded-3xl overflow-hidden"
    >
      {/* Imagem */}
      <div className="relative aspect-[16/10] overflow-hidden bg-flora-sand dark:bg-white/5">
        {photo ? (
          <img
            src={photo}
            alt={business.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-flora-green/15 to-flora-fresh/10">
            <span className="font-serif text-5xl text-flora-green/40 dark:text-flora-fresh/40">{business.name[0]}</span>
          </div>
        )}

        {/* Badges sobre a imagem */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isPremium && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-flora-gold text-flora-ink uppercase tracking-wide shadow-sm">
              Premium
            </span>
          )}
          {isVisibility && !isPremium && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-flora-green text-white uppercase tracking-wide shadow-sm">
              Destaque
            </span>
          )}
        </div>

        {open !== null && (
          <span className={`absolute top-3 right-3 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full backdrop-blur-md shadow-sm ${
            open ? "bg-white/90 text-flora-green" : "bg-white/90 text-red-500"
          }`}>
            <Clock className="w-3 h-3" />
            {open ? "Aberto" : "Fechado"}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold flora-ink leading-tight group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors line-clamp-1">
          {business.name}
        </h3>

        <div className="flex items-center gap-3 mt-1.5">
          {business.googleRating && (
            <span className="flex items-center gap-1 text-sm">
              <Star className="w-3.5 h-3.5 fill-flora-gold text-flora-gold" />
              <span className="font-semibold flora-ink">{business.googleRating.toFixed(1)}</span>
              {business.googleRatingCount && (
                <span className="flora-muted text-xs">({business.googleRatingCount})</span>
              )}
            </span>
          )}
        </div>

        <p className="mt-2 text-xs flora-muted flex items-center gap-1 line-clamp-1">
          <MapPin className="w-3 h-3 flex-shrink-0 text-flora-green/60" />
          {business.address.split(",").slice(0, 2).join(",")}
        </p>

        {business.whatsapp && (
          <div className="mt-3" onClick={e => e.preventDefault()}>
            <a
              href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-flora-green dark:text-flora-fresh hover:gap-2 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Falar no WhatsApp
            </a>
          </div>
        )}
      </div>
    </Link>
  )
}
