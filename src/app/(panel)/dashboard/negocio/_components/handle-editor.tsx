"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Link2, Copy, Check, Sparkles } from "lucide-react"

export function HandleEditor({
  initialHandle, suggested, siteUrl,
}: {
  initialHandle: string | null; suggested: string; siteUrl: string
}) {
  const [handle, setHandle] = useState(initialHandle ?? "")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const host = siteUrl.replace(/^https?:\/\//, "")

  function clean(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 40)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/negocio", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success(handle ? "Link personalizado salvo!" : "Link removido")
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${siteUrl}/${handle}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold dash-title flex items-center gap-2">
          <Link2 className="w-4 h-4 text-flora-gold" /> Link personalizado da sua loja
        </h2>
        <p className="text-xs dash-muted mt-0.5">Um endereço curto e bonito pra mandar no WhatsApp e nas redes.</p>
      </div>

      <div className="flex items-stretch rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden focus-within:border-emerald-500 transition-colors">
        <span className="flex items-center px-3 text-xs dash-muted bg-gray-50 dark:bg-white/[0.03] border-r border-gray-200 dark:border-white/10 whitespace-nowrap">{host}/</span>
        <input value={handle} onChange={e => setHandle(clean(e.target.value))}
          placeholder={suggested}
          className="flex-1 px-3 py-2.5 bg-transparent text-sm dash-title focus:outline-none" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={save} disabled={saving}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar link"}
        </button>
        {!handle && suggested && (
          <button onClick={() => setHandle(suggested)} type="button"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-flora-gold" /> Usar &quot;{suggested}&quot;
          </button>
        )}
        {initialHandle && (
          <button onClick={copyLink} type="button"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            Copiar link
          </button>
        )}
      </div>
      {initialHandle && (
        <p className="text-xs dash-muted">Seu link atual: <span className="font-semibold text-flora-green dark:text-flora-fresh">{host}/{initialHandle}</span></p>
      )}
    </div>
  )
}
