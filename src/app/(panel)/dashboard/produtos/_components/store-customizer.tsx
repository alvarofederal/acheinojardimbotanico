"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { Loader2, ImagePlus, Sparkles, X, Move } from "lucide-react"

const DEFAULT_POS = "50% 50%"
const clamp = (n: number) => Math.min(100, Math.max(0, n))
function parsePos(s: string) {
  const [x, y] = s.split(" ")
  return { x: parseFloat(x) || 50, y: parseFloat(y) || 50 }
}

export function StoreCustomizer({
  initialCover, initialTagline, initialPos,
}: { initialCover: string | null; initialTagline: string | null; initialPos: string | null }) {
  const [cover, setCover] = useState(initialCover ?? "")
  const [pos, setPos] = useState(initialPos ?? DEFAULT_POS)
  const [tagline, setTagline] = useState(initialTagline ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)

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
      setPos(DEFAULT_POS) // capa nova começa centralizada
    } catch { toast.error("Erro de rede") } finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  // Arrastar a foto pra enquadrar (estilo Facebook): grab move a imagem
  function onDown(e: React.PointerEvent) {
    if (!cover) return
    const p = parsePos(pos)
    drag.current = { sx: e.clientX, sy: e.clientY, px: p.x, py: p.y }
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current, box = boxRef.current
    if (!d || !box) return
    const r = box.getBoundingClientRect()
    const nx = clamp(d.px - (e.clientX - d.sx) / r.width * 100)
    const ny = clamp(d.py - (e.clientY - d.sy) / r.height * 100)
    setPos(`${Math.round(nx)}% ${Math.round(ny)}%`)
  }
  function onUp() { drag.current = null }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/negocio", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeCoverUrl: cover, storeCoverPos: pos, storeTagline: tagline }),
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
        <div
          ref={boxRef}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          className={`relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 aspect-[16/6] bg-flora-sand dark:bg-white/5 ${cover ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
        >
          {cover
            ? <img src={cover} alt="Capa da loja" draggable={false} style={{ objectPosition: pos }} className="w-full h-full object-cover select-none pointer-events-none" />
            : <div className="w-full h-full flex items-center justify-center text-xs dash-muted">Sem capa — usaremos a 1ª foto do perfil</div>}

          {cover && (
            <>
              {/* Dica de arraste */}
              <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-none">
                <Move className="w-3 h-3" /> Arraste para enquadrar
              </div>
              <button type="button" onPointerDown={e => e.stopPropagation()} onClick={() => { setCover(""); setPos(DEFAULT_POS) }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-medium dash-title hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            {cover ? "Trocar capa" : "Enviar capa"}
          </button>
          {cover && pos !== DEFAULT_POS && (
            <button type="button" onClick={() => setPos(DEFAULT_POS)}
              className="text-xs dash-muted hover:text-flora-green transition-colors">Centralizar</button>
          )}
        </div>
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
