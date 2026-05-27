"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, User, Building2, Phone, ShieldQuestion } from "lucide-react"
import { WhatsappIcon } from "@/components/whatsapp-icon"

interface Claim {
  id: string
  message: string | null
  createdAt: Date
  business: { id: string; name: string; slug: string; neighborhood: string; phone: string | null; whatsapp: string | null }
  user: { id: string; name: string | null; email: string | null }
}

/** Monta o link do WhatsApp pro número OFICIAL do negócio (verificação). */
function confirmWaUrl(phone: string, businessName: string): string {
  let d = phone.replace(/\D/g, "")
  if (d.length < 10) return ""
  if (!d.startsWith("55")) d = "55" + d
  const msg = `Olá! Aqui é do *Achei no Jardim Botânico* 🌿 Recebemos um pedido para reivindicar o perfil de *${businessName}*. Foi você ou alguém da equipe? Pode confirmar, por favor? Assim a gente libera o acesso com segurança.`
  return `https://wa.me/${d}?text=${encodeURIComponent(msg)}`
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

          {/* Verificação de propriedade — confirme pelo telefone OFICIAL do negócio */}
          {(claim.business.whatsapp || claim.business.phone) ? (
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-500/[0.07] border border-amber-200 dark:border-amber-500/25 space-y-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <ShieldQuestion className="w-3.5 h-3.5" /> Confirme a propriedade antes de aprovar
              </p>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/80">
                Telefone oficial do negócio (Google): <strong>{claim.business.whatsapp ?? claim.business.phone}</strong>. Confirme com esse número que foi mesmo o dono.
              </p>
              <div className="flex gap-2 flex-wrap">
                {confirmWaUrl(claim.business.whatsapp ?? claim.business.phone ?? "", claim.business.name) && (
                  <a href={confirmWaUrl(claim.business.whatsapp ?? claim.business.phone ?? "", claim.business.name)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
                    <WhatsappIcon className="w-3.5 h-3.5" /> Confirmar no WhatsApp
                  </a>
                )}
                <a href={`tel:${(claim.business.phone ?? claim.business.whatsapp ?? "").replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100/60 dark:hover:bg-amber-500/10 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Ligar
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Este negócio não tem telefone listado — confirme a propriedade por outro meio antes de aprovar.</p>
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
