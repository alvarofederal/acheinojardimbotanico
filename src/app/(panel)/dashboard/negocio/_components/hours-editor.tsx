"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save, Plus, X, Clock } from "lucide-react"
import { toEditorModel, fromEditorModel, type DayHours } from "@/lib/opening-hours"

const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
const labelCls = "text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide"
const timeCls = "px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title focus:outline-none focus:border-emerald-500 transition-colors"

export function HoursEditor({ openingHours, feriadoFechadoInicial }: { openingHours: unknown; feriadoFechadoInicial: boolean }) {
  const [days, setDays] = useState<DayHours[]>(() => toEditorModel(openingHours))
  const [feriadoFechado, setFeriadoFechado] = useState(feriadoFechadoInicial)
  const [saving, setSaving] = useState(false)

  const patch = (i: number, p: Partial<DayHours>) => setDays(d => d.map((day, idx) => (idx === i ? { ...day, ...p } : day)))

  function toggleClosed(i: number) {
    const d = days[i]
    if (d.closed) patch(i, { closed: false, ranges: d.ranges.length ? d.ranges : [{ open: "09:00", close: "18:00" }] })
    else patch(i, { closed: true })
  }
  const addRange = (i: number) => patch(i, { ranges: [...days[i].ranges, { open: "09:00", close: "18:00" }] })
  const removeRange = (i: number, ri: number) => patch(i, { ranges: days[i].ranges.filter((_, x) => x !== ri) })
  const setRange = (i: number, ri: number, f: "open" | "close", v: string) =>
    patch(i, { ranges: days[i].ranges.map((r, x) => (x === ri ? { ...r, [f]: v } : r)) })

  function copyToWeekdays(i: number) {
    const src = days[i]
    setDays(d => d.map((day, idx) => (idx >= 1 && idx <= 5 ? { closed: src.closed, ranges: src.ranges.map(r => ({ ...r })) } : day)))
    toast.success("Copiado para segunda a sexta")
  }

  async function save() {
    setSaving(true)
    try {
      const openingHours = fromEditorModel(days, feriadoFechado)
      const res = await fetch("/api/dashboard/negocio", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingHours }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success("Horários salvos!")
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-emerald-500" />
        <p className="font-semibold dash-title">Horário de funcionamento</p>
      </div>
      <p className="text-xs dash-subtitle -mt-2">Você controla aqui — vale mais que o que veio do Google. Pode dividir em turnos (ex.: 09:00–13:00 e 14:00–18:00).</p>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] divide-y divide-gray-50 dark:divide-white/[0.04]">
        {DAYS.map((name, i) => {
          const d = days[i]
          return (
            <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 px-4 py-3">
              <div className="flex items-center justify-between sm:w-44 sm:flex-shrink-0">
                <span className="text-sm font-medium dash-title">{name}</span>
                <button type="button" onClick={() => toggleClosed(i)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${d.closed ? "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50" : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"}`}>
                  {d.closed ? "Fechado" : "Aberto"}
                </button>
              </div>

              {d.closed ? (
                <span className="text-sm text-gray-400 dark:text-white/30 sm:py-1">Fechado o dia todo</span>
              ) : (
                <div className="flex-1 space-y-2">
                  {d.ranges.map((r, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <input type="time" value={r.open} onChange={e => setRange(i, ri, "open", e.target.value)} className={timeCls} />
                      <span className="text-gray-400">–</span>
                      <input type="time" value={r.close} onChange={e => setRange(i, ri, "close", e.target.value)} className={timeCls} />
                      {d.ranges.length > 1 && (
                        <button type="button" onClick={() => removeRange(i, ri)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Remover turno">
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => addRange(i)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Turno
                    </button>
                    {i >= 1 && i <= 5 && (
                      <button type="button" onClick={() => copyToWeekdays(i)} className="text-xs text-gray-400 dark:text-white/40 hover:underline">
                        Copiar p/ seg–sex
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Feriado — ou é Feriado (informativo) ou o lojista marca que fecha */}
      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-500/[0.07] border border-amber-100 dark:border-amber-500/20 cursor-pointer">
        <input type="checkbox" checked={feriadoFechado} onChange={e => setFeriadoFechado(e.target.checked)} className="mt-0.5 accent-amber-500" />
        <span className="text-sm dash-title">
          <span className="font-semibold">Fecho em feriados</span>
          <span className="block text-xs dash-subtitle mt-0.5">Se desmarcado, em feriado o perfil mostra <strong>“Feriado”</strong> (sem afirmar que está fechado). Marcado, mostra <strong>“Fechado”</strong>.</span>
        </span>
      </label>

      <button type="button" onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar horários</>}
      </button>
    </div>
  )
}
