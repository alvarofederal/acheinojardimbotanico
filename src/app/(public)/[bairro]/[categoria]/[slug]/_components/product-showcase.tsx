"use client"

import { useState } from "react"
import { ShoppingBag, MessageCircle, X } from "lucide-react"

interface Variation { nome: string; opcoes: string[] }
interface Product {
  id: string
  name: string
  description: string | null
  categoria: string | null
  priceMode: "FIXED" | "FROM" | "ON_REQUEST"
  priceCents: number | null
  images: string[]
  variations: Variation[]
  soldOut: boolean
}

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
function priceLabel(p: Product) {
  if (p.priceMode === "ON_REQUEST") return "Sob consulta"
  const v = brl(p.priceCents ?? 0)
  return p.priceMode === "FROM" ? `A partir de ${v}` : v
}

export function ProductShowcase({
  products, businessId, whatsapp, storeMessage, businessUrl,
}: {
  products: Product[]; businessId: string; whatsapp: string | null; storeMessage: string | null; businessUrl: string
}) {
  const [sort, setSort] = useState("recent")
  const [selected, setSelected] = useState<Product | null>(null)

  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc") return (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity)
    if (sort === "price_desc") return (b.priceCents ?? -1) - (a.priceCents ?? -1)
    return 0 // recent = ordem original (order asc)
  })

  function buy(p: Product) {
    if (!whatsapp) return
    const base = storeMessage?.trim() || "Olá! Tenho interesse neste produto que vi no Achei no Jardim Botânico."
    const text = `${base}\n\n*${p.name}* — ${priceLabel(p)}\n${businessUrl}`
    fetch("/api/track/whatsapp", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId }),
    }).catch(() => {})
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-serif text-2xl font-semibold flora-ink flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-flora-green dark:text-flora-fresh" /> Produtos
        </h2>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2 rounded-full text-sm flora-chip flora-ink bg-transparent focus:outline-none">
          <option value="recent">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {sorted.map(p => (
          <button key={p.id} onClick={() => setSelected(p)}
            className="flora-card rounded-2xl overflow-hidden text-left group">
            <div className="aspect-square bg-flora-sand dark:bg-white/5 relative overflow-hidden">
              {p.images[0]
                ? <img src={p.images[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-flora-green/30" /></div>}
              {p.soldOut && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">Esgotado</span>}
            </div>
            <div className="p-3">
              {p.categoria && <p className="text-[10px] uppercase tracking-wide flora-muted">{p.categoria}</p>}
              <p className="text-sm font-semibold flora-ink leading-tight line-clamp-1">{p.name}</p>
              <p className="text-sm text-flora-green dark:text-flora-fresh font-medium mt-0.5">{priceLabel(p)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal do produto */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-md my-8 bg-white dark:bg-[#0f1c18] rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-square bg-flora-sand dark:bg-white/5">
              {selected.images[0]
                ? <img src={selected.images[0]} alt={selected.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-flora-green/30" /></div>}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            {selected.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {selected.images.map((img, i) => <img key={i} src={img} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />)}
              </div>
            )}
            <div className="p-5 space-y-3">
              {selected.categoria && <p className="text-xs uppercase tracking-wide flora-muted">{selected.categoria}</p>}
              <h3 className="font-serif text-xl font-semibold flora-ink">{selected.name}</h3>
              <p className="text-lg text-flora-green dark:text-flora-fresh font-semibold">{priceLabel(selected)}</p>
              {selected.description && <p className="text-sm flora-muted leading-relaxed">{selected.description}</p>}
              {selected.variations?.map((v, i) => (
                <p key={i} className="text-xs flora-muted"><strong className="flora-ink">{v.nome}:</strong> {v.opcoes.join(", ")}</p>
              ))}
              {whatsapp && !selected.soldOut && (
                <button onClick={() => buy(selected)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-flora-green hover:bg-flora-fresh text-white text-sm font-semibold transition-all shadow-lg shadow-flora-green/25">
                  <MessageCircle className="w-4 h-4" /> Comprar pelo WhatsApp
                </button>
              )}
              {selected.soldOut && <p className="text-center text-sm text-red-500 font-medium">Produto esgotado</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
