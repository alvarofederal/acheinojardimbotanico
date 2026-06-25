"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star, ShoppingBag, BadgeCheck } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"
import { FavoriteHeart } from "@/components/favorite-heart"
import { getOpenStatus, type OpenStatus, type OpenState } from "@/lib/opening-hours"

interface BusinessCardProps {
  business: {
    id: string
    slug: string
    handle?: string | null
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

const DOT: Record<OpenState, string> = {
  aberto: "bg-emerald-400",
  fechado: "bg-red-400",
  feriado: "bg-amber-400",
  desconhecido: "bg-gray-300",
}

/**
 * Card de negócio — MESMO padrão das "joias" da home: vertical 4:5, imagem
 * sangrada, nome sobreposto, anel dourado no hover. Fundo verde sempre presente
 * (nunca fica "quebrado" enquanto a imagem carrega / se falhar). Status de
 * funcionamento pela lib única (aberto/fechado/feriado/não informado), calculado
 * no cliente (hora local) pra não destoar do servidor.
 */
export function BusinessCard({ business, bairro, categoria }: BusinessCardProps) {
  const photo = business.photos[0]?.url
  const seloLabel = business.seloLabel ?? null
  const featured = business.featured ?? false
  const storeHref = business.storeHref ?? null
  // URL curta (handle) é o endereço real; sem handle, cai na longa
  const profileHref = business.handle ? `/${business.handle}` : `/${bairro}/${categoria}/${business.slug}`
  const wa = business.whatsapp ? `https://wa.me/${business.whatsapp.replace(/\D/g, "")}` : null

  // Status só no cliente (evita mismatch SSR em UTC × hora de Brasília)
  const [status, setStatus] = useState<OpenStatus | null>(null)
  useEffect(() => { setStatus(getOpenStatus(business.openingHours)) }, [business.openingHours])

  return (
    <article className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-lg shadow-flora-deep/15 flora-rise transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-flora-deep/30">
      {/* Fundo sempre presente — placeholder verde + inicial (some atrás da foto) */}
      <div className="absolute inset-0 bg-gradient-to-br from-flora-green to-flora-deep flex items-center justify-center">
        <span className="font-serif text-6xl text-white/15 select-none">{business.name[0]}</span>
      </div>

      {/* Foto (por cima do placeholder); se falhar, some e revela o fundo */}
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={business.name} loading="lazy"
          onError={(e) => { e.currentTarget.style.opacity = "0" }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
      )}

      {/* Scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-flora-deep/95 via-flora-deep/35 to-transparent" />
      {/* Anel dourado no hover */}
      <div className="absolute inset-0 rounded-3xl border-[1.5px] border-transparent group-hover:border-flora-gold/80 transition-colors duration-500 pointer-events-none z-30" />

      {/* Link cobrindo o card */}
      <Link href={profileHref} className="absolute inset-0 z-10" aria-label={`Ver ${business.name}`} />

      {/* Coração (se posiciona sozinho no topo-esquerdo) */}
      <FavoriteHeart item={{ id: business.id, name: business.name, href: profileHref, photo: photo ?? null }} />

      {/* Selos — ao lado do coração */}
      <div className="absolute top-3 left-[3.4rem] z-20 flex flex-wrap gap-1.5 max-w-[55%]">
        {seloLabel && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-[#1d9bf0] text-white uppercase tracking-wide shadow-sm"><BadgeCheck className="w-2.5 h-2.5" /> Verificado</span>
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

      {/* Nota — canto superior direito */}
      {business.googleRating != null && (
        <span className="absolute top-3 right-3 z-20 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-white/92 text-flora-ink shadow-sm">
          <Star className="w-3 h-3 fill-flora-gold text-flora-gold" />
          {business.googleRating.toFixed(1)}
        </span>
      )}

      {/* Conteúdo embaixo */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pointer-events-none">
        {/* Status (sempre informa algo) */}
        {status && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/35 backdrop-blur-sm text-white mb-2">
            <span className={`w-1.5 h-1.5 rounded-full ${DOT[status.state]}`} />
            {status.label}
          </span>
        )}

        <h3 className="font-serif text-lg sm:text-xl font-semibold text-white leading-tight line-clamp-2" style={{ textShadow: "0 2px 14px rgba(0,0,0,.45)" }}>
          {business.name}
        </h3>

        {business.googleRatingCount != null && (
          <p className="mt-1 text-[12px] text-white/80">{business.googleRatingCount} avaliações</p>
        )}

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
