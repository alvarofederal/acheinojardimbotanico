"use client"

import { useState, useMemo } from "react"
import { Search, Clock } from "lucide-react"
import { BusinessCard } from "./business-card"

interface BusinessItem {
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
  products?: Array<{ id: string }>
  featured?: boolean
  seloLabel?: string | null
  storeHref?: string | null
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

export function CategoryList({
  businesses,
  bairro,
  categoria,
}: {
  businesses: BusinessItem[]
  bairro: string
  categoria: string
}) {
  const [query, setQuery] = useState("")
  const [openOnly, setOpenOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return businesses.filter(b => {
      if (q && !b.name.toLowerCase().includes(q) && !b.address.toLowerCase().includes(q)) return false
      if (openOnly && isOpenNow(b.openingHours) !== true) return false
      return true
    })
  }, [businesses, query, openOnly])

  return (
    <div className="space-y-6">
      {/* Controles — barra que acompanha a rolagem (fica sob o cabeçalho fixo) */}
      <div className="sticky top-[68px] z-30">
        <div className="flex items-center gap-2 rounded-full bg-white/85 dark:bg-flora-deep/80 backdrop-blur-xl ring-1 ring-flora-green/10 dark:ring-white/10 shadow-lg shadow-flora-green/5 p-1.5 pl-4">
          {/* Busca */}
          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-4 h-4 text-flora-green/50 flex-shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar nesta categoria..."
              className="w-full pl-2.5 pr-2 py-2 bg-transparent text-sm flora-ink placeholder:text-flora-ink/35 focus:outline-none"
            />
          </div>
          {/* Contagem ao vivo */}
          <span className="hidden sm:inline text-xs flora-muted whitespace-nowrap px-1">
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </span>
          <span className="hidden sm:block w-px h-5 bg-flora-green/15 dark:bg-white/10" />
          {/* Aberto agora */}
          <button
            onClick={() => setOpenOnly(v => !v)}
            aria-pressed={openOnly}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 inline-flex items-center gap-1.5 ${
              openOnly
                ? "bg-flora-green text-white shadow-md shadow-flora-green/20"
                : "text-flora-ink hover:bg-flora-green/5 dark:hover:bg-white/5"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Aberto agora
          </button>
        </div>
      </div>

      {/* Resultado */}
      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <p className="font-serif text-lg flora-ink mb-1">Nada por aqui ainda</p>
          <p className="text-sm flora-muted">Tente outro termo{openOnly ? " ou desligue o filtro “Aberto agora”" : ""}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(business => (
            <BusinessCard key={business.id} business={business} bairro={bairro} categoria={categoria} />
          ))}
        </div>
      )}
    </div>
  )
}
