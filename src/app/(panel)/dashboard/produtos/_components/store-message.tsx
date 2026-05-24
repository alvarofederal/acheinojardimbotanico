"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, MessageCircle } from "lucide-react"

export function StoreMessage({ initial }: { initial: string }) {
  const [msg, setMsg] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/negocio", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeWhatsappMessage: msg }),
      })
      if (res.ok) toast.success("Mensagem salva!")
      else toast.error("Erro ao salvar")
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-2">
      <label className="text-sm font-semibold dash-title flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-emerald-500" /> Mensagem do WhatsApp
      </label>
      <p className="text-xs dash-muted">Aparece quando o cliente clica em &quot;Comprar&quot;. O link do produto é anexado automaticamente.</p>
      <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={2}
        placeholder="Olá! Tenho interesse neste produto que vi no Achei no Jardim Botânico."
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title focus:outline-none focus:border-emerald-500 resize-none" />
      <button onClick={save} disabled={saving}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar mensagem"}
      </button>
    </div>
  )
}
