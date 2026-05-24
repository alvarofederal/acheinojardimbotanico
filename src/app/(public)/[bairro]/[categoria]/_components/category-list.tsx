"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
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
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-flora-green/50" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar nesta categoria..."
            className="w-full pl-11 pr-4 py-3 rounded-full bg-white/70 dark:bg-white/[0.04] border border-flora-green/10 dark:border-white/10 text-sm flora-ink placeholder:text-flora-ink/35 focus:outline-none focus:ring-2 focus:ring-flora-fresh/40 transition-all"
          />
        </div>
        <button
          onClick={() => setOpenOnly(v => !v)}
          className={`px-5 py-3 rounded-full text-sm font-semibold transition-all flex-shrink-0 ${
            openOnly
              ? "bg-flora-green text-white shadow-lg shadow-flora-green/20"
              : "flora-chip flora-ink"
          }`}
        >
          Aberto agora
        </button>
      </div>

      {/* Resultado */}
      {filtered.length === 0 ? (
        <p className="text-center py-12 text-sm flora-muted">
          Nenhum resultado para os filtros atuais.
        </p>
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
