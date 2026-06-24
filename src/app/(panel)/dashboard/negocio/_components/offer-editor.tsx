"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, Megaphone, Crown, CalendarClock } from "lucide-react"

/**
 * Oferta em destaque no perfil (perk Premium). Uma oferta ativa por negócio.
 * Salva via PATCH /api/dashboard/negocio. Prazo no formato YYYY-MM-DD (input date).
 */
export function OfferEditor({
  enabled, initialActive, initialTitle, initialText, initialDeadline,
}: {
  enabled: boolean
  initialActive: boolean
  initialTitle: string
  initialText: string
  initialDeadline: string // "YYYY-MM-DD" ou ""
}) {
  const [active, setActive] = useState(initialActive)
  const [title, setTitle] = useState(initialTitle)
  const [text, setText] = useState(initialText)
  const [deadline, setDeadline] = useState(initialDeadline)
  const [saving, setSaving] = useState(false)

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-flora-gold/30 bg-flora-gold/[0.06] p-5">
        <h2 className="text-sm font-semibold dash-title flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-flora-gold" /> Oferta em destaque no perfil
        </h2>
        <p className="text-xs dash-muted mt-1">
          Um banner de oferta com prazo no topo do seu perfil — o jeito de trazer cliente hoje. Disponível no plano <b>Premium</b>.
        </p>
        <Link href="/dashboard/plano"
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-flora-gold hover:brightness-105 text-flora-ink text-xs font-semibold transition-all">
          <Crown className="w-3.5 h-3.5" /> Ver o Premium
        </Link>
      </div>
    )
  }

  async function save() {
    if (active && !title.trim()) { toast.error("Dê um título pra oferta (ex.: 10% até sábado)"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/negocio", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerActive: active,
          offerTitle: title,
          offerText: text,
          offerDeadline: deadline,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success(active ? "Oferta publicada no seu perfil!" : "Oferta salva (desligada)")
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold dash-title flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-flora-gold" /> Oferta em destaque no perfil
          </h2>
          <p className="text-xs dash-muted mt-0.5">Aparece em destaque no topo do seu perfil, com botão direto no WhatsApp.</p>
        </div>
        {/* Liga/desliga */}
        <button type="button" onClick={() => setActive(v => !v)} aria-pressed={active}
          className={`shrink-0 relative w-12 h-7 rounded-full transition-colors ${active ? "bg-emerald-500" : "bg-gray-300 dark:bg-white/15"}`}>
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${active ? "translate-x-5" : ""}`} />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Título da oferta</label>
        <input value={title} onChange={e => setTitle(e.target.value.slice(0, 80))}
          placeholder="Ex.: 10% de desconto até sábado"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title focus:outline-none focus:border-emerald-500 transition-colors" />
        <p className="text-xs text-gray-400 dark:text-white/25">{title.length}/80</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Detalhe (opcional)</label>
        <textarea rows={2} value={text} onChange={e => setText(e.target.value.slice(0, 280))}
          placeholder="Ex.: Na compra de qualquer combo. Válido para retirada e entrega."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title focus:outline-none focus:border-emerald-500 transition-colors resize-none" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" /> Prazo (opcional)
        </label>
        <div className="flex items-center gap-2">
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title focus:outline-none focus:border-emerald-500 transition-colors" />
          {deadline && (
            <button type="button" onClick={() => setDeadline("")} className="text-xs dash-muted hover:text-red-500 transition-colors">remover prazo</button>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-white/25">Com prazo, mostramos a contagem (“termina sábado”) e a oferta some sozinha quando vence.</p>
      </div>

      <button onClick={save} disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar oferta"}
      </button>
    </div>
  )
}
