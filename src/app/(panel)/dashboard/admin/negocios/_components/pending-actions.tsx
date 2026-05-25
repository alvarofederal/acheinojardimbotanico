"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, X, Loader2 } from "lucide-react"

export function PendingActions({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function act(action: "approve" | "reject") {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/negocios/${businessId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      toast.success(action === "approve" ? "Negócio aprovado!" : "Negócio rejeitado")
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setLoading(null) }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => act("approve")} disabled={!!loading} title="Aprovar"
        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors">
        {loading === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button onClick={() => act("reject")} disabled={!!loading} title="Rejeitar"
        className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 transition-colors">
        {loading === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
