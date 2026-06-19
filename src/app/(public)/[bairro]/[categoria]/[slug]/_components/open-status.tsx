"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { getOpenStatus, weekRows, type OpenState } from "@/lib/opening-hours"

/**
 * Status "aberto agora" do perfil — calculado AO VIVO no client (hora de
 * Brasília via lib), igual ao card da listagem. Antes era calculado no
 * servidor (UTC) e congelado pelo ISR (revalidate=3600), o que fazia o
 * perfil divergir do card. Agora os dois usam a mesma fonte, no mesmo fuso.
 */

const TONE: Record<OpenState, string> = {
  aberto: "bg-flora-fresh/90 text-white",
  feriado: "bg-amber-400/90 text-flora-ink",
  fechado: "bg-black/40 text-white/80 backdrop-blur-sm",
  desconhecido: "bg-black/40 text-white/80 backdrop-blur-sm",
}

function labelFor(state: OpenState, fallback: string) {
  return state === "aberto" ? "Aberto agora" : state === "fechado" ? "Fechado agora" : fallback
}

/** Pílula do herói. */
export function OpenStatusPill({ openingHours }: { openingHours: unknown }) {
  const [s, setS] = useState<{ state: OpenState; label: string } | null>(null)
  useEffect(() => { const r = getOpenStatus(openingHours); setS({ state: r.state, label: r.label }) }, [openingHours])
  if (!s) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${TONE[s.state]}`}>
      <Clock className="w-3.5 h-3.5" /> {labelFor(s.state, s.label)}
    </span>
  )
}

/** Card de "fatos rápidos": status + horário de hoje. */
export function OpenStatusFact({ openingHours }: { openingHours: unknown }) {
  const [s, setS] = useState<{ state: OpenState; label: string; today: string } | null>(null)
  useEffect(() => {
    const r = getOpenStatus(openingHours)
    const today = weekRows(openingHours).find(x => x.today)?.text ?? ""
    setS({ state: r.state, label: r.label, today })
  }, [openingHours])
  if (!s) return null
  const open = s.state === "aberto"
  return (
    <div className="flex gap-3.5 items-start flora-card rounded-2xl p-4">
      <span className="w-11 h-11 rounded-xl bg-flora-green/10 text-flora-green flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5" /></span>
      <div>
        <b className={`block text-sm ${open ? "text-flora-green dark:text-flora-fresh" : "flora-ink"}`}>{labelFor(s.state, s.label)}</b>
        <span className="text-xs flora-muted">{s.today}</span>
      </div>
    </div>
  )
}
