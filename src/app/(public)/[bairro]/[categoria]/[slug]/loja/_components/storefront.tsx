"use client"

import { useState, useMemo } from "react"
import { ShoppingBag, X, Sparkles } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"

interface Variation { nome: string; opcoes: string[] }
export interface StoreProduct {
  id: string
  name: string
  description: string | null
  categoria: string | null
  priceMode: "FIXED" | "FROM" | "ON_REQUEST"
  priceCents: number | null
  promoPriceCents: number | null
  images: string[]
  variations: Variation[]
  soldOut: boolean
  featured: boolean
}

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
function isPromo(p: StoreProduct) {
  return !!p.promoPriceCents && p.priceMode !== "ON_REQUEST" && (p.priceCents == null || p.promoPriceCents < p.priceCents)
}
function priceLabel(p: StoreProduct) {
  if (p.priceMode === "ON_REQUEST") return "Sob consulta"
  if (isPromo(p)) return brl(p.promoPriceCents!)
  const v = brl(p.priceCents ?? 0)
  return p.priceMode === "FROM" ? `A partir de ${v}` : v
}

export function StoreFront({
  products, businessId, whatsapp, storeMessage, businessUrl,
}: {
  products: StoreProduct[]; businessId: string; whatsapp: string | null; storeMessage: string | null; businessUrl: string
}) {
  const [selected, setSelected] = useState<StoreProduct | null>(null)
  const [activeImg, setActiveImg] = useState(0)

  // Agrupa: Destaques (featured) + seções por categoria + Outros
  const sections = useMemo(() => {
    const featured = products.filter(p => p.featured)
    const rest = products.filter(p => !p.featured)
    const byCat = new Map<string, StoreProduct[]>()
    for (const p of rest) {
      const key = p.categoria?.trim() || "Outros"
      if (!byCat.has(key)) byCat.set(key, [])
      byCat.get(key)!.push(p)
    }
    const out: { title: string; highlight?: boolean; items: StoreProduct[] }[] = []
    if (featured.length) out.push({ title: "Destaques", highlight: true, items: featured })
    for (const [title, items] of byCat) out.push({ title, items })
    return out
  }, [products])

  function openProduct(p: StoreProduct) { setActiveImg(0); setSelected(p) }

  function buy(p: StoreProduct) {
    if (!whatsapp) return
    const base = storeMessage?.trim() || "Olá! Tenho interesse neste produto que vi no Achei no Jardim Botânico."
    const text = `${base}\n\n*${p.name}* — ${priceLabel(p)}\n${businessUrl}`
    fetch("/api/track/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId }) }).catch(() => {})
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <div className="space-y-12">
      {sections.map(section => (
        <section key={section.title}>
          <div className="flex items-center gap-2 mb-5">
            {section.highlight
              ? <Sparkles className="w-5 h-5 text-flora-gold" />
              : <span className="w-1.5 h-6 rounded-full bg-flora-green dark:bg-flora-fresh" />}
            <h2 className="font-serif text-2xl font-semibold flora-ink">{section.title}</h2>
            <span className="text-sm flora-muted">· {section.items.length}</span>
          </div>

          <div className={`grid gap-4 ${section.highlight ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
            {section.items.map(p => (
              <button key={p.id} onClick={() => openProduct(p)}
                className={`flora-card rounded-2xl overflow-hidden text-left group ${section.highlight ? "ring-1 ring-flora-gold/30" : ""}`}>
                <div className="aspect-square bg-flora-sand dark:bg-white/5 relative overflow-hidden">
                  {p.images[0]
                    ? <img src={p.images[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-flora-green/30" /></div>}
                  {p.soldOut && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">Esgotado</span>}
                  {!p.soldOut && isPromo(p) && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-flora-gold text-flora-ink">Oferta</span>}
                  {!p.soldOut && p.featured && !isPromo(p) && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-flora-green text-white">Destaque</span>}
                </div>
                <div className="p-3">
                  {p.categoria && <p className="text-[10px] uppercase tracking-wide flora-muted">{p.categoria}</p>}
                  <p className="text-sm font-semibold flora-ink leading-tight line-clamp-1">{p.name}</p>
                  <p className="text-sm font-medium mt-0.5">
                    <span className="text-flora-green dark:text-flora-fresh">{priceLabel(p)}</span>
                    {isPromo(p) && p.priceCents != null && <span className="ml-1.5 text-xs flora-muted line-through">{brl(p.priceCents)}</span>}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Modal do produto */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-md my-8 bg-white dark:bg-[#0f1c18] rounded-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative aspect-square bg-flora-sand dark:bg-white/5">
              {selected.images[activeImg] ?? selected.images[0]
                ? <img src={selected.images[activeImg] ?? selected.images[0]} alt={selected.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-flora-green/30" /></div>}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            {selected.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {selected.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${i === activeImg ? "border-flora-green dark:border-flora-fresh" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="p-5 space-y-3">
              {selected.categoria && <p className="text-xs uppercase tracking-wide flora-muted">{selected.categoria}</p>}
              <h3 className="font-serif text-xl font-semibold flora-ink">{selected.name}</h3>
              <p className="flex items-baseline gap-2">
                <span className="text-lg text-flora-green dark:text-flora-fresh font-semibold">{priceLabel(selected)}</span>
                {isPromo(selected) && selected.priceCents != null && <span className="text-sm flora-muted line-through">{brl(selected.priceCents)}</span>}
                {isPromo(selected) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-flora-gold text-flora-ink">Oferta</span>}
              </p>
              {selected.description && <p className="text-sm flora-muted leading-relaxed">{selected.description}</p>}
              {selected.variations?.map((v, i) => (
                <p key={i} className="text-xs flora-muted"><strong className="flora-ink">{v.nome}:</strong> {v.opcoes.join(", ")}</p>
              ))}
              {whatsapp && !selected.soldOut && (
                <button onClick={() => buy(selected)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-flora-green hover:bg-flora-fresh text-white text-sm font-semibold transition-all shadow-lg shadow-flora-green/25">
                  <WhatsappIcon className="w-4 h-4" /> Comprar pelo WhatsApp
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
