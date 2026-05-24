"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, Building2, CreditCard } from "lucide-react"
import { formatBRL } from "@/lib/plans"

interface Claim {
  id: string
  plan: string
  method: string
  months: number
  amountCents: number
  note: string | null
  createdAt: Date
  business: { name: string; neighborhood: string }
  user: { name: string | null; email: string | null }
}

export function PaymentsTable({ claims }: { claims: Claim[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function act(id: string, action: "confirm" | "reject") {
    setLoading(id + action)
    try {
      const res = await fetch(`/api/admin/pagamentos/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      toast.success(action === "confirm" ? "Plano liberado!" : "Pagamento rejeitado")
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setLoading(null) }
  }

  if (claims.length === 0) return (
    <div className="text-center py-16 text-gray-400 dark:text-white/30">
      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Nenhum pagamento pendente</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {claims.map(c => (
        <div key={c.id} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-gray-400 dark:text-white/30 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold dash-title text-sm truncate">{c.business.name}</p>
                <p className="text-xs dash-muted">{c.user.name ?? "—"} · {c.user.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-serif text-xl font-bold dash-title">{formatBRL(c.amountCents)}</p>
              <p className="text-xs dash-muted">{c.plan} · {c.months}{c.months > 1 ? " meses" : " mês"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs dash-muted">
            <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> {c.method === "PIX" ? "PIX" : "Cartão (Mercado Pago)"}</span>
            <span>·</span>
            <span>{new Date(c.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {c.note && <p className="text-xs dash-subtitle p-2 rounded-lg bg-gray-50 dark:bg-white/[0.03]">{c.note}</p>}

          <div className="flex gap-2">
            <button onClick={() => act(c.id, "confirm")} disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {loading === c.id + "confirm" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Confirmar e liberar
            </button>
            <button onClick={() => act(c.id, "reject")} disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 text-sm font-medium transition-colors">
              {loading === c.id + "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
