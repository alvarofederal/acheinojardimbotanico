"use client"

import Link from "next/link"
import { Star, ShoppingBag } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"
import { FavoriteHeart } from "@/components/favorite-heart"

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
    hasStore?: boolean
    products?: Array<{ id: string }>
    featured?: boolean
    seloLabel?: string | null
    storeHref?: string | null
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

/**
 * Card de negócio — MESMO padrão das "joias" da home: vertical 4:5, imagem
 * sangrada, nome sobreposto, anel dourado no hover. Preserva nota + número de
 * avaliações, status aberto/fechado, selos e os botões (WhatsApp / Ver loja).
 */
export function BusinessCard({ business, bairro, categoria }: BusinessCardProps) {
  const photo = business.photos[0]?.url
  const open = isOpenNow(business.openingHours)
  const seloLabel = business.seloLabel ?? null
  const featured = business.featured ?? false
  const storeHref = business.storeHref ?? null
  const profileHref = `/${bairro}/${categoria}/${business.slug}`
  const wa = business.whatsapp ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}` : null

  return (
    <article className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-lg shadow-flora-deep/15 flora-rise transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-flora-deep/30">
      {/* Foto de fundo */}
      {photo ? (
        <img src={photo} alt={business.name} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-flora-green to-flora-deep flex items-center justify-center">
          <span className="font-serif text-6xl text-white/70">{business.name[0]}</span>
        </div>
      )}

      {/* Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-flora-deep/95 via-flora-deep/35 to-transparent" />
      {/* Anel dourado no hover */}
      <div className="absolute inset-0 rounded-3xl border-[1.5px] border-transparent group-hover:border-flora-gold/80 transition-colors duration-500 pointer-events-none z-30" />

      {/* Link cobrindo o card (clique → perfil) */}
      <Link href={profileHref} className="absolute inset-0 z-10" aria-label={`Ver ${business.name}`} />

      {/* Coração (clique isolado, já se posiciona no topo-esquerdo) */}
      <FavoriteHeart item={{ id: business.id, name: business.name, href: profileHref, photo: photo ?? null }} />

      {/* Selos — ao lado do coração */}
      <div className="absolute top-3 left-[3.4rem] z-20 flex flex-wrap gap-1.5 max-w-[55%]">
        {seloLabel && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-flora-gold text-flora-ink uppercase tracking-wide shadow-sm">{seloLabel}</span>
        )}
        {featured && !seloLabel && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-flora-green text-white uppercase tracking-wide shadow-sm">Destaque</span>
        )}
        {storeHref && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-white/90 text-flora-green uppercase tracking-wide shadow-sm">
            <ShoppingBag className="w-2.5 h-2.5" /> Loja
          </span>
        )}
      </div>

      {/* Nota — canto superior direito (como na home) */}
      {business.googleRating != null && (
        <span className="absolute top-3 right-3 z-20 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/92 text-flora-ink shadow-sm">
          <Star className="w-3 h-3 fill-flora-gold text-flora-gold" />
          {business.googleRating.toFixed(1)}
        </span>
      )}

      {/* Conteúdo embaixo */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pointer-events-none">
        <h3 className="font-serif text-lg sm:text-xl font-semibold text-white leading-tight line-clamp-2" style={{ textShadow: "0 2px 14px rgba(0,0,0,.45)" }}>
          {business.name}
        </h3>

        {/* Status + número de avaliações (sempre visível) */}
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/85">
          {open !== null && (
            <span className="inline-flex items-center gap-1 font-semibold">
              <span className={`w-1.5 h-1.5 rounded-full ${open ? "bg-emerald-400" : "bg-red-400"}`} />
              {open ? "Aberto" : "Fechado"}
            </span>
          )}
          {business.googleRatingCount != null && (
            <>
              {open !== null && <span className="opacity-50">·</span>}
              <span>{business.googleRatingCount} avaliações</span>
            </>
          )}
        </p>

        {/* Botões — clicáveis acima do link do card */}
        {(wa || storeHref) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="pointer-events-auto inline-flex items-center gap-1.5 bg-[#25a35a] hover:bg-[#1f8f4e] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-105">
                <WhatsappIcon className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {storeHref && (
              <Link href={storeHref}
                className="pointer-events-auto inline-flex items-center gap-1.5 bg-flora-gold hover:brightness-105 text-flora-ink text-xs font-semibold px-3 py-1.5 rounded-full transition-all">
                <ShoppingBag className="w-3.5 h-3.5" /> Ver loja
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
