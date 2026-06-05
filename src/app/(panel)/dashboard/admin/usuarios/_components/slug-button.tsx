"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Link2, X, Loader2, Sparkles } from "lucide-react"
import { slugify } from "@/lib/utils"

const HOST = "acheinojardimbotanico.com.br"

export function SlugButton({
  businessId, businessName, currentHandle,
}: {
  businessId: string; businessName: string; currentHandle: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const suggested = slugify(businessName).slice(0, 40)
  const [handle, setHandle] = useState(currentHandle ?? suggested)

  function clean(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 40)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/negocios/${businessId}/handle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success(handle ? "Slug salvo!" : "Slug removido")
      setOpen(false)
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} title="Configurar slug (link curto)"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-400 text-xs font-semibold hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors">
        <Link2 className="w-3.5 h-3.5" /> Slug
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#0f1c18] rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-semibold dash-title flex items-center gap-2"><Link2 className="w-5 h-5 text-sky-500" /> Link curto</h3>
                <p className="text-xs dash-muted mt-0.5">{businessName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
            </div>

            <div className="flex items-stretch rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden focus-within:border-sky-500 transition-colors">
              <span className="flex items-center px-3 text-xs dash-muted bg-gray-50 dark:bg-white/[0.03] border-r border-gray-200 dark:border-white/10 whitespace-nowrap">{HOST}/</span>
              <input value={handle} onChange={e => setHandle(clean(e.target.value))} placeholder={suggested}
                className="flex-1 px-3 py-2.5 bg-transparent text-sm dash-title focus:outline-none" />
            </div>

            {handle !== suggested && (
              <button onClick={() => setHandle(suggested)} type="button"
                className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline">
                <Sparkles className="w-3.5 h-3.5" /> Usar sugestão: {suggested}
              </button>
            )}

            <p className="text-xs dash-muted">
              Cartão e display vão usar este endereço. Deixe vazio para remover.
            </p>

            <button onClick={save} disabled={saving}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Salvar slug
            </button>
          </div>
        </div>
      )}
    </>
  )
}
