"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Loader2, ImagePlus, Sparkles, X } from "lucide-react"

export function StoreCustomizer({ initialCover, initialTagline }: { initialCover: string | null; initialTagline: string | null }) {
  const [cover, setCover] = useState(initialCover ?? "")
  const [tagline, setTagline] = useState(initialTagline ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro no upload"); return }
      setCover(data.imageUrl)
    } catch { toast.error("Erro de rede") } finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/negocio", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCoverUrl: cover, storeTagline: tagline }),
      })
      if (res.ok) toast.success("Loja personalizada!")
      else { const d = await res.json(); toast.error(d.error ?? "Erro ao salvar") }
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold dash-title flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-flora-gold" /> Personalização da loja
        </h2>
        <p className="text-xs dash-muted mt-0.5">A capa e o slogan aparecem no topo da sua loja pública.</p>
      </div>

      {/* Capa */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Foto de capa</label>
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 aspect-[16/6] bg-flora-sand dark:bg-white/5">
          {cover
            ? <img src={cover} alt="Capa da loja" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xs dash-muted">Sem capa — usaremos a 1ª foto do perfil</div>}
          {cover && (
            <button type="button" onClick={() => setCover("")} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-medium dash-title hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          {cover ? "Trocar capa" : "Enviar capa"}
        </button>
      </div>

      {/* Slogan */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Slogan da loja</label>
        <input value={tagline} onChange={e => setTagline(e.target.value)} maxLength={140}
          placeholder="Ex: Os melhores quadros personalizados do Jardim Botânico"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title focus:outline-none focus:border-emerald-500 transition-colors" />
        <p className="text-[11px] dash-muted text-right">{tagline.length}/140</p>
      </div>

      <button onClick={save} disabled={saving || uploading}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar personalização"}
      </button>
    </div>
  )
}
