"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, CreditCard, Printer, X, Loader2, Store } from "lucide-react"
import { CardCard, type CardCardData } from "@/components/card-card"

interface Result { id: string; name: string; category: string; card: CardCardData }

export function CartaoHub({ acheiCard }: { acheiCard: CardCardData }) {
  const [acheiOpen, setAcheiOpen] = useState(false)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Result | null>(null)

  // Busca com debounce
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/negocios/search?q=${encodeURIComponent(term)}`)
        const d = await r.json()
        setResults(d.results ?? [])
      } catch { setResults([]) } finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="space-y-6">
      {/* Meu cartão (Achei) */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold dash-title">Meu cartão (Achei no Jardim Botânico)</p>
            <p className="text-xs dash-muted">Seu cartão de visita pessoal da marca.</p>
          </div>
        </div>
        <button onClick={() => setAcheiOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          Gerar meu cartão
        </button>
      </div>

      {/* Busca de qualquer negócio */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
        <div>
          <p className="font-semibold dash-title">Cartão de um negócio</p>
          <p className="text-xs dash-muted">Busque pelo nome e gere o cartão de qualquer lojista — não precisa entrar no perfil.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dash-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Digite o nome do negócio..."
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>

        {loading && <p className="text-xs dash-muted flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...</p>}
        {!loading && q.trim().length >= 2 && results.length === 0 && (
          <p className="text-xs dash-muted">Nenhum negócio encontrado.</p>
        )}

        {results.length > 0 && (
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04] rounded-xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
            {results.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                <Store className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium dash-title truncate">{r.name}</p>
                  <p className="text-xs dash-muted truncate">{r.category}</p>
                </div>
                <CreditCard className="w-4 h-4 dash-muted flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal: cartão do Achei */}
      {acheiOpen && (
        <CardModal title="Meu cartão" subtitle="Achei no Jardim Botânico" data={acheiCard} printHref="/card-print/achei" onClose={() => setAcheiOpen(false)} />
      )}

      {/* Modal: cartão do negócio selecionado */}
      {selected && (
        <CardModal title="Cartão do negócio" subtitle={selected.name} data={selected.card} printHref={`/card-print/${selected.id}`} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function CardModal({ title, subtitle, data, printHref, onClose }: { title: string; subtitle: string; data: CardCardData; printHref: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#0f1c18] rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-semibold dash-title flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-500" /> {title}</h3>
            <p className="text-xs dash-muted mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
        </div>
        <div className="flex justify-center">
          <div className="rounded-lg overflow-hidden" style={{ boxShadow: "0 8px 24px rgba(30,92,69,0.18)" }}>
            <CardCard data={data} />
          </div>
        </div>
        <Link href={printHref} target="_blank" rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Printer className="w-4 h-4" /> Imprimir / Gerar PDF (folha A4)
        </Link>
      </div>
    </div>
  )
}
