"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Copy, Check, Star, ExternalLink, MapPin } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"

export interface Prospect {
  id: string
  name: string
  category: string
  neighborhood: string
  rating: number | null
  ratingCount: number | null
  phone: string | null
  profileUrl: string
  waUrl: string | null
  pitch: string
  contacted: boolean
}

export function ProspectList({ items }: { items: Prospect[] }) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map(p => [p.id, p.contacted]))
  )
  const [copied, setCopied] = useState<string | null>(null)

  function copy(p: Prospect) {
    navigator.clipboard.writeText(p.pitch)
    setCopied(p.id)
    setTimeout(() => setCopied(c => (c === p.id ? null : c)), 1800)
  }

  async function toggle(p: Prospect) {
    const next = !state[p.id]
    setState(s => ({ ...s, [p.id]: next }))
    try {
      const res = await fetch(`/api/admin/prospeccao/${p.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setState(s => ({ ...s, [p.id]: !next })) // reverte
      toast.error("Erro ao salvar")
    }
  }

  if (items.length === 0) return (
    <div className="text-center py-16 dash-muted text-sm">Nenhum negócio com esses filtros.</div>
  )

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(p => {
        const done = state[p.id]
        return (
          <div key={p.id} className={`rounded-2xl border bg-white dark:bg-white/[0.02] p-4 flex flex-col gap-3 transition-colors ${done ? "border-emerald-200 dark:border-emerald-500/30 opacity-70" : "border-gray-100 dark:border-white/[0.07]"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold dash-title text-sm leading-tight">{p.name}</p>
                <p className="text-[11px] dash-muted flex items-center gap-1 mt-0.5">
                  {p.category}
                  {p.rating != null && <><span>·</span><Star className="w-3 h-3 fill-flora-gold text-flora-gold" />{p.rating.toFixed(1)}{p.ratingCount ? ` (${p.ratingCount})` : ""}</>}
                </p>
                <p className="text-[11px] dash-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{p.neighborhood}</p>
              </div>
              {done && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex-shrink-0">Contatado</span>}
            </div>

            <p className="text-xs dash-muted">{p.phone ?? "sem telefone"}</p>

            <div className="mt-auto flex flex-wrap gap-2">
              {p.waUrl ? (
                <a href={p.waUrl} target="_blank" rel="noopener noreferrer" onClick={() => { if (!done) toggle(p) }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-flora-green hover:bg-flora-fresh text-white text-xs font-semibold transition-colors">
                  <WhatsappIcon className="w-3.5 h-3.5" /> WhatsApp
                </a>
              ) : (
                <span className="flex-1 text-center px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-[11px] dash-muted">sem WhatsApp</span>
              )}
              <button onClick={() => copy(p)} title="Copiar pitch"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                {copied === p.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={p.profileUrl} target="_blank" rel="noopener noreferrer" title="Ver perfil"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <label className="flex items-center gap-2 text-xs dash-subtitle cursor-pointer">
              <input type="checkbox" checked={done} onChange={() => toggle(p)} className="w-4 h-4 rounded accent-emerald-600" />
              Marcar como contatado
            </label>
          </div>
        )
      })}
    </div>
  )
}
