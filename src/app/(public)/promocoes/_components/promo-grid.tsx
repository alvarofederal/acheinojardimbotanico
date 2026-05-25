"use client"

import { useState } from "react"
import Link from "next/link"
import { MessageCircle, Store, Tag } from "lucide-react"

export interface PromoItem {
  id: string
  name: string
  description: string | null
  priceCents: number | null
  promoPriceCents: number
  image: string | null
  businessId: string
  businessName: string
  whatsapp: string | null
  storeMessage: string | null
  storeUrl: string
  storeHref: string
}

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function PromoGrid({ items, categories }: { items: PromoItem[]; categories: string[] }) {
  const [sort, setSort] = useState("recent")

  const sorted = [...items].sort((a, b) => {
    if (sort === "price_asc") return a.promoPriceCents - b.promoPriceCents
    if (sort === "price_desc") return b.promoPriceCents - a.promoPriceCents
    return 0
  })

  function buy(p: PromoItem) {
    if (!p.whatsapp) return
    const base = p.storeMessage?.trim() || "Olá! Vi esta oferta no Achei no Jardim Botânico:"
    const text = `${base}\n\n*${p.name}* — ${brl(p.promoPriceCents)}\n${p.storeUrl}`
    fetch("/api/track/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: p.businessId }) }).catch(() => {})
    window.open(`https://wa.me/${p.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm flora-muted">{items.length} {items.length === 1 ? "oferta" : "ofertas"} ativas</p>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2 rounded-full text-sm flora-chip flora-ink bg-transparent focus:outline-none">
          <option value="recent">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sorted.map(p => {
          const discount = p.priceCents && p.priceCents > p.promoPriceCents
            ? Math.round((1 - p.promoPriceCents / p.priceCents) * 100) : 0
          return (
            <div key={p.id} className="flora-card rounded-2xl overflow-hidden flex flex-col">
              <Link href={p.storeHref} className="block relative aspect-square bg-flora-sand dark:bg-white/5 overflow-hidden group">
                {p.image
                  ? <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><Tag className="w-8 h-8 text-flora-green/30" /></div>}
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-flora-gold text-flora-ink">
                  {discount > 0 ? `-${discount}%` : "Oferta"}
                </span>
              </Link>
              <div className="p-3 flex flex-col flex-1">
                <Link href={p.storeHref} className="text-[11px] flora-muted flex items-center gap-1 hover:text-flora-green dark:hover:text-flora-fresh transition-colors">
                  <Store className="w-3 h-3" /> {p.businessName}
                </Link>
                <p className="text-sm font-semibold flora-ink leading-tight line-clamp-1 mt-0.5">{p.name}</p>
                {p.description && <p className="text-xs flora-muted line-clamp-2 mt-0.5">{p.description}</p>}
                <p className="mt-1.5">
                  <span className="text-flora-green dark:text-flora-fresh font-bold">{brl(p.promoPriceCents)}</span>
                  {p.priceCents != null && p.priceCents > p.promoPriceCents && <span className="ml-1.5 text-xs flora-muted line-through">{brl(p.priceCents)}</span>}
                </p>
                {p.whatsapp && (
                  <button onClick={() => buy(p)}
                    className="mt-2.5 flex items-center justify-center gap-1.5 py-2 rounded-full bg-flora-green hover:bg-flora-fresh text-white text-xs font-semibold transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" /> Comprar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* categorias só informativo — filtro futuro */}
      {categories.length > 0 && <p className="text-xs flora-muted">Categorias com ofertas: {categories.join(" · ")}</p>}
    </div>
  )
}
