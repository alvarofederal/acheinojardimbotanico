"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, User, Building2 } from "lucide-react"

interface Claim {
  id: string
  message: string | null
  createdAt: Date
  business: { id: string; name: string; slug: string; neighborhood: string }
  user: { id: string; name: string | null; email: string | null }
}

export function ClaimsTable({ claims }: { claims: Claim[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(claimId: string, action: "approve" | "reject") {
    setLoading(claimId + action)
    try {
      const res = await fetch(`/api/admin/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      toast.success(action === "approve" ? "Reivindicação aprovada!" : "Reivindicação rejeitada")
      router.refresh()
    } catch {
      toast.error("Erro de rede")
    } finally {
      setLoading(null)
    }
  }

  if (claims.length === 0) return (
    <div className="text-center py-16 text-gray-400 dark:text-white/30">
      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Nenhuma reivindicação pendente</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {claims.map(claim => (
        <div key={claim.id} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-start gap-4 flex-wrap">
            {/* Negócio */}
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Building2 className="w-4 h-4 text-gray-400 dark:text-white/30 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold dash-title text-sm truncate">{claim.business.name}</p>
                <p className="text-xs dash-muted">{claim.business.neighborhood}</p>
              </div>
            </div>
            {/* Usuário */}
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-400 dark:text-white/30 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm dash-subtitle">{claim.user.name ?? "—"}</p>
                <p className="text-xs dash-muted">{claim.user.email}</p>
              </div>
            </div>
          </div>

          {/* Mensagem */}
          {claim.message && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] text-sm dash-subtitle whitespace-pre-line">
              {claim.message}
            </div>
          )}

          <p className="text-xs dash-muted">
            Enviado em {new Date(claim.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>

          {/* Ações */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(claim.id, "approve")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading === claim.id + "approve"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCircle className="w-3.5 h-3.5" />}
              Aprovar
            </button>
            <button
              onClick={() => handleAction(claim.id, "reject")}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading === claim.id + "reject"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <XCircle className="w-3.5 h-3.5" />}
              Rejeitar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
