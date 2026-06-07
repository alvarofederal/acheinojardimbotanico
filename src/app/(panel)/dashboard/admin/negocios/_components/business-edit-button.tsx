"use client"

import { useState, useRef, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, X, Loader2, Link2, Sparkles, Power, PowerOff, Image as ImageIcon, Upload, Trash2 } from "lucide-react"
import { slugify } from "@/lib/utils"

const HOST = "acheinojardimbotanico.com.br"

export function BusinessEditButton({
  businessId, businessName, currentHandle, active, hasOwner, currentLogo,
}: {
  businessId: string; businessName: string; currentHandle: string | null; active: boolean; hasOwner: boolean; currentLogo: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const suggested = slugify(businessName).slice(0, 40)
  const [handle, setHandle] = useState(currentHandle ?? "")
  const [statusActive, setStatusActive] = useState(active)
  const [logo, setLogo] = useState<string | null>(currentLogo)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPickLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const r = await fetch(`/api/admin/negocios/${businessId}/logo`, { method: "POST", body: fd })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error ?? "Erro no upload"); return }
      setLogo(d.url)
      toast.success("Logo atualizada")
      router.refresh()
    } catch { toast.error("Erro de rede") }
    finally { setUploadingLogo(false); if (fileRef.current) fileRef.current.value = "" }
  }

  async function removeLogo() {
    setUploadingLogo(true)
    try {
      const r = await fetch(`/api/admin/negocios/${businessId}/logo`, { method: "DELETE" })
      if (!r.ok) { toast.error("Erro ao remover"); return }
      setLogo(null)
      toast.success("Logo removida")
      router.refresh()
    } catch { toast.error("Erro de rede") }
    finally { setUploadingLogo(false) }
  }

  function clean(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 40)
  }

  async function save() {
    setSaving(true)
    try {
      // 1) Slug, se mudou
      if (handle !== (currentHandle ?? "")) {
        const r = await fetch(`/api/admin/negocios/${businessId}/handle`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle }),
        })
        const d = await r.json()
        if (!r.ok) { toast.error(d.error ?? "Erro no slug"); return }
      }
      // 2) Status, se mudou
      if (statusActive !== active) {
        const r = await fetch(`/api/admin/negocios/${businessId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: statusActive ? "activate" : "deactivate" }),
        })
        const d = await r.json()
        if (!r.ok) { toast.error(d.error ?? "Erro no status"); return }
      }
      toast.success("Negócio atualizado")
      setOpen(false)
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} title="Editar negócio"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 dash-subtitle text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
        <Pencil className="w-3.5 h-3.5" /> Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#0f1c18] rounded-2xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-semibold dash-title flex items-center gap-2"><Pencil className="w-5 h-5 text-emerald-500" /> Editar negócio</h3>
                <p className="text-xs dash-muted mt-0.5">{businessName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
            </div>

            {/* Logo do cartão */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Logo do cartão</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white flex items-center justify-center flex-shrink-0">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-300 dark:text-white/20" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors">
                    {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {logo ? "Trocar" : "Subir logo"}
                  </button>
                  {logo && (
                    <button type="button" onClick={removeLogo} disabled={uploadingLogo}
                      className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-60">
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onPickLogo} className="hidden" />
              </div>
              <p className="text-xs dash-muted">Pega a logo no site da empresa e sobe aqui — vai no cartão e no display em alta qualidade.</p>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Link curto (slug)</label>
              <div className="flex items-stretch rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden focus-within:border-emerald-500 transition-colors">
                <span className="flex items-center px-3 text-xs dash-muted bg-gray-50 dark:bg-white/[0.03] border-r border-gray-200 dark:border-white/10 whitespace-nowrap">{HOST}/</span>
                <input value={handle} onChange={e => setHandle(clean(e.target.value))} placeholder={suggested}
                  className="flex-1 px-3 py-2.5 bg-transparent text-sm dash-title focus:outline-none" />
              </div>
              {handle !== suggested && (
                <button onClick={() => setHandle(suggested)} type="button" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                  <Sparkles className="w-3.5 h-3.5" /> Usar sugestão: {suggested}
                </button>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Status</label>
              <div className="flex gap-2">
                <button onClick={() => setStatusActive(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${statusActive ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-200 dark:border-white/10 dash-subtitle"}`}>
                  <Power className="w-4 h-4" /> Ativo
                </button>
                <button onClick={() => setStatusActive(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${!statusActive ? "bg-red-600 border-red-600 text-white" : "border-gray-200 dark:border-white/10 dash-subtitle"}`}>
                  <PowerOff className="w-4 h-4" /> Inativo
                </button>
              </div>
              {!statusActive && active && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-500/[0.08] rounded-lg p-2.5">
                  Ao salvar, o negócio <strong>some do site</strong>{hasOwner && <> e o dono é <strong>deslogado</strong> (não entra até reativar)</>}.
                </p>
              )}
            </div>

            <button onClick={save} disabled={saving}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />} Salvar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
