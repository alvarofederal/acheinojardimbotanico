"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Power, PowerOff, Loader2, X } from "lucide-react"

/**
 * Liga/desliga um negócio (LGPD / pedido do lojista).
 * Desativar = esconde do site + desativa o login do dono (se houver) e o desloga.
 */
export function ActiveToggle({
  businessId, businessName, active, hasOwner,
}: {
  businessId: string; businessName: string; active: boolean; hasOwner: boolean
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  async function run() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/negocios/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: active ? "deactivate" : "activate" }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      toast.success(active ? "Negócio desativado" : "Negócio reativado")
      setConfirming(false)
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        title={active ? "Desativar (esconder do site)" : "Reativar"}
        className={`p-1.5 rounded-lg transition-colors ${
          active
            ? "hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500"
            : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-500"
        }`}
      >
        {active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setConfirming(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#0f1c18] rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-lg font-semibold dash-title">
                {active ? "Desativar negócio" : "Reativar negócio"}
              </h3>
              <button onClick={() => setConfirming(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
            </div>
            <p className="text-sm dash-subtitle">
              {active ? (
                <>
                  <strong className="dash-title">{businessName}</strong> vai <strong>sumir do site</strong> imediatamente.
                  {hasOwner && <> O dono será <strong>deslogado</strong> e não conseguirá entrar até reativar.</>}
                </>
              ) : (
                <>
                  <strong className="dash-title">{businessName}</strong> volta a <strong>aparecer no site</strong>.
                  {hasOwner && <> O dono volta a conseguir entrar.</>}
                </>
              )}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle text-sm font-medium">Cancelar</button>
              <button onClick={run} disabled={saving}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 ${active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                {active ? "Desativar" : "Reativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
