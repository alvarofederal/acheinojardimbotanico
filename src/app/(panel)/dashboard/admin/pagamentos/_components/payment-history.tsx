"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Building2, History } from "lucide-react"
import { formatBRL, PLAN_LABEL, type PlanId } from "@/lib/plans"

interface HistoryItem {
  id: string
  plan: string
  method: string
  months: number
  amountCents: number
  status: string
  note: string | null
  createdAt: Date
  reviewedAt: Date | null
  business: { name: string; neighborhood: string }
  user: { name: string | null; email: string | null }
}

type Filter = "ALL" | "CONFIRMED" | "REJECTED"

export function PaymentHistory({ items }: { items: HistoryItem[] }) {
  const [filter, setFilter] = useState<Filter>("ALL")

  const filtered = items.filter(i => filter === "ALL" || i.status === filter)

  const tabs: { id: Filter; label: string }[] = [
    { id: "ALL", label: `Todos (${items.length})` },
    { id: "CONFIRMED", label: `Confirmados (${items.filter(i => i.status === "CONFIRMED").length})` },
    { id: "REJECTED", label: `Rejeitados (${items.filter(i => i.status === "REJECTED").length})` },
  ]

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-semibold dash-title flex items-center gap-1.5">
          <History className="w-4 h-4 dash-muted" /> Histórico
        </h2>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === t.id
                  ? "bg-flora-green text-white"
                  : "border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-white/30">
          <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum registro</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
          {filtered.map(c => {
            const confirmed = c.status === "CONFIRMED"
            const isCourtesy = c.method === "COURTESY"
            const methodLabel = isCourtesy ? "Cortesia 🎁" : c.method === "PIX" ? "PIX" : "Mercado Pago"
            return (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <div className={`flex-shrink-0 ${isCourtesy ? "text-amber-500" : confirmed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                  {confirmed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold dash-title text-sm truncate flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 dash-muted flex-shrink-0" /> {c.business.name}
                  </p>
                  <p className="text-xs dash-muted truncate">
                    {PLAN_LABEL[c.plan as PlanId] ?? c.plan} · {c.months}{c.months > 1 ? " meses" : " mês"} · {methodLabel}
                    {c.user.email ? ` · ${c.user.email}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-semibold text-sm ${isCourtesy ? "text-amber-600 dark:text-amber-400" : confirmed ? "dash-title" : "dash-muted line-through"}`}>
                    {isCourtesy ? "Cortesia" : formatBRL(c.amountCents)}
                  </p>
                  <p className="text-[11px] dash-muted">
                    {c.reviewedAt
                      ? new Date(c.reviewedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
                      : "—"}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
