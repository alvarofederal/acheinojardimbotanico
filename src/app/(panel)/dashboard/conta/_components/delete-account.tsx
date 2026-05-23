"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch("/api/lgpd/delete-my-data", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao excluir"); setLoading(false); return }
      toast.success("Conta excluída. Até logo!")
      await signOut({ callbackUrl: "/" })
    } catch {
      toast.error("Erro de rede")
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/[0.04] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <h2 className="font-semibold text-red-700 dark:text-red-400 text-sm">Excluir minha conta</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-white/50">
        Remove permanentemente seus dados pessoais e desvincula seus negócios (os dados
        públicos do negócio permanecem no guia). Esta ação não pode ser desfeita.
      </p>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors"
        >
          Excluir conta
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-white/40">
            Digite <strong className="text-red-600 dark:text-red-400">EXCLUIR</strong> para confirmar:
          </p>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="EXCLUIR"
              className="flex-1 px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/20 bg-transparent text-sm dash-title focus:outline-none focus:border-red-500 transition-colors"
            />
            <button
              onClick={handleDelete}
              disabled={text !== "EXCLUIR" || loading}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar exclusão"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
