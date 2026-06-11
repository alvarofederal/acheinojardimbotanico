"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy, Check, Star, ExternalLink, MapPin } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"

/** Estágio da cadência de contato: D0 → D+3 → D+7 → frio. */
export interface Cadence {
  next: "d0" | "d3" | "d7" | null // próximo toque (null = ciclo completo)
  due: boolean                     // o próximo toque está vencido (agir hoje)
  label: string                    // texto do badge
}

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
  cadence: Cadence
}

const TOUCH_BTN: Record<"d0" | "d3" | "d7", { label: string; cls: string }> = {
  d0: { label: "WhatsApp",        cls: "bg-flora-green hover:bg-flora-fresh" },
  d3: { label: "Follow-up D+3",   cls: "bg-amber-600 hover:bg-amber-700" },
  d7: { label: "Última (D+7)",    cls: "bg-red-700 hover:bg-red-800" },
}

function badgeCls(c: Cadence): string {
  if (c.next === "d0") return "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
  if (c.next === null) return "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40"
  if (c.due) return c.next === "d7"
    ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400"
    : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"
  return "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400"
}

export function ProspectList({ items }: { items: Prospect[] }) {
  const router = useRouter()
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  function copy(p: Prospect) {
    navigator.clipboard.writeText(p.pitch)
    setCopied(p.id)
    setTimeout(() => setCopied(c => (c === p.id ? null : c)), 1800)
  }

  async function registerTouch(p: Prospect, touch: "d0" | "d3" | "d7") {
    setSaving(p.id)
    try {
      const res = await fetch(`/api/admin/prospeccao/${p.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ touch }),
      })
      if (!res.ok) throw new Error()
      router.refresh() // recarrega estágios (badge + mensagem do próximo toque)
    } catch {
      toast.error("Erro ao registrar o toque")
    } finally { setSaving(null) }
  }

  async function reset(p: Prospect) {
    setSaving(p.id)
    try {
      const res = await fetch(`/api/admin/prospeccao/${p.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: false }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      toast.error("Erro ao resetar")
    } finally { setSaving(null) }
  }

  if (items.length === 0) return (
    <div className="text-center py-16 dash-muted text-sm">Nenhum negócio com esses filtros.</div>
  )

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(p => {
        const c = p.cadence
        const btn = c.next ? TOUCH_BTN[c.next] : null
        return (
          <div key={p.id} className={`rounded-2xl border bg-white dark:bg-white/[0.02] p-4 flex flex-col gap-3 transition-colors ${c.next === null ? "border-gray-100 dark:border-white/[0.07] opacity-60" : c.due ? "border-amber-300 dark:border-amber-500/40" : "border-gray-100 dark:border-white/[0.07]"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold dash-title text-sm leading-tight">{p.name}</p>
                <p className="text-[11px] dash-muted flex items-center gap-1 mt-0.5">
                  {p.category}
                  {p.rating != null && <><span>·</span><Star className="w-3 h-3 fill-flora-gold text-flora-gold" />{p.rating.toFixed(1)}{p.ratingCount ? ` (${p.ratingCount})` : ""}</>}
                </p>
                <p className="text-[11px] dash-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{p.neighborhood}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeCls(c)}`}>{c.label}</span>
            </div>

            <p className="text-xs dash-muted">{p.phone ?? "sem telefone"}</p>

            <div className="mt-auto flex flex-wrap gap-2">
              {p.waUrl && btn && c.next ? (
                <a href={p.waUrl} target="_blank" rel="noopener noreferrer"
                  onClick={() => { if (saving !== p.id) registerTouch(p, c.next!) }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-colors ${btn.cls}`}>
                  <WhatsappIcon className="w-3.5 h-3.5" /> {btn.label}
                </a>
              ) : !p.waUrl ? (
                <span className="flex-1 text-center px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-[11px] dash-muted">sem WhatsApp</span>
              ) : (
                <span className="flex-1 text-center px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-[11px] dash-muted">ciclo completo · recicla em 60d</span>
              )}
              <button onClick={() => copy(p)} title="Copiar mensagem do estágio atual"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                {copied === p.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={p.profileUrl} target="_blank" rel="noopener noreferrer" title="Ver perfil"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {p.contacted && (
              <button onClick={() => reset(p)} disabled={saving === p.id}
                className="text-[11px] dash-muted hover:text-red-500 transition-colors text-left disabled:opacity-50">
                ↺ Resetar cadência (recomeça do D0)
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
