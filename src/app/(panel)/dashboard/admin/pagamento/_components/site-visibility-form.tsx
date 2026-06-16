"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save, Eye } from "lucide-react"

export interface SiteCfg {
  showPromocoes: boolean
  showNoticias: boolean
  showEventos: boolean
  showVagas: boolean
}

const FEATURES: { key: keyof SiteCfg; label: string }[] = [
  { key: "showPromocoes", label: "Promoções" },
  { key: "showNoticias", label: "Notícias" },
  { key: "showEventos", label: "Eventos" },
  { key: "showVagas", label: "Vagas" },
]

export function SiteVisibilityForm({ site }: { site: SiteCfg }) {
  const [state, setState] = useState<SiteCfg>(site)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/site-visibility", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success("Visibilidade salva!")
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold dash-title">
          <Eye className="w-4 h-4 text-emerald-500" /> Visibilidade no site
        </h2>
        <p className="text-[12px] dash-muted mt-1 leading-relaxed">
          Liga o link de cada funcionalidade no site (navbar, rodapé, página e botão no perfil).
          Mesmo ligado, só aparece quando houver <strong>≥ 1 conteúdo publicado</strong> — nunca mostra página vazia.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {FEATURES.map(f => (
          <label key={f.key}
            className="flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-white/[0.07] px-3 py-2.5 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
            <input type="checkbox" checked={state[f.key]} onChange={e => setState(s => ({ ...s, [f.key]: e.target.checked }))}
              data-testid={`vis-${f.key}`} className="w-4 h-4 rounded accent-emerald-600" />
            <span className="text-sm dash-title">{f.label}</span>
          </label>
        ))}
      </div>
      <button onClick={save} disabled={saving} data-testid="save-visibility"
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar visibilidade</>}
      </button>
    </div>
  )
}
