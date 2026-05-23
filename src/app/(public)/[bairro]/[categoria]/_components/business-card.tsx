"use client"

import Link from "next/link"
import { MapPin, Star, Phone, MessageCircle, Clock } from "lucide-react"

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
      className="group flex gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] hover:border-emerald-200 dark:hover:border-emerald-500/20 hover:shadow-sm transition-all"
    >
      {/* Foto */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5">
        {photo ? (
          <img src={photo} alt={business.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white/20 text-2xl font-bold">
            {business.name[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {business.name}
          </h3>
          {isPremium && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 uppercase tracking-wide flex-shrink-0">
              Premium
            </span>
          )}
          {isVisibility && !isPremium && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex-shrink-0">
              Destaque
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {business.googleRating && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/50">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-medium text-gray-700 dark:text-white/70">{business.googleRating.toFixed(1)}</span>
              {business.googleRatingCount && (
                <span className="text-gray-400 dark:text-white/30">({business.googleRatingCount})</span>
              )}
            </span>
          )}
          {open !== null && (
            <span className={`text-xs font-medium ${open ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
              <Clock className="w-3 h-3 inline mr-0.5" />
              {open ? "Aberto" : "Fechado"}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-gray-400 dark:text-white/35 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {business.address.split(",").slice(0, 2).join(",")}
        </p>

        {/* CTAs */}
        <div className="flex gap-2 mt-2" onClick={e => e.preventDefault()}>
          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
          )}
          {business.phone && !business.whatsapp && (
            <a
              href={`tel:${business.phone}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Phone className="w-3 h-3" />
              Ligar
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}
