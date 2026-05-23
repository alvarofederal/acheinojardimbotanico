"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react"

interface Photo {
  id: string
  url: string
  source: string
}

interface PhotoManagerProps {
  photos: Photo[]
  plan: string
  limit: number
}

export function PhotoManager({ photos, plan, limit }: PhotoManagerProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const ownerPhotos = photos.filter(p => p.source === "OWNER_UPLOAD")
  const googlePhotos = photos.filter(p => p.source === "GOOGLE_PLACES")
  const canAddMore = ownerPhotos.length < limit

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Upload para Cloudinary
      const fd = new FormData()
      fd.append("file", file)
      const upRes = await fetch("/api/upload", { method: "POST", body: fd })
      const upData = await upRes.json()
      if (!upRes.ok) { toast.error(upData.error ?? "Erro no upload"); return }

      // 2. Salva referência no negócio
      const res = await fetch("/api/dashboard/negocio/fotos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: upData.imageUrl }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar foto"); return }

      toast.success("Foto adicionada!")
      router.refresh()
    } catch {
      toast.error("Erro de rede")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleDelete(photoId: string) {
    setDeleting(photoId)
    try {
      const res = await fetch(`/api/dashboard/negocio/fotos/${photoId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao remover"); return }
      toast.success("Foto removida")
      router.refresh()
    } catch {
      toast.error("Erro de rede")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold dash-title text-sm uppercase tracking-wide flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-500" />
          Fotos
        </h2>
        <span className="text-xs dash-muted">
          {ownerPhotos.length}/{limit} no plano {plan}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {/* Fotos do Google (não removíveis) */}
        {googlePhotos.map(photo => (
          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 group">
            <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute bottom-1 left-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white/80">
              Google
            </span>
          </div>
        ))}

        {/* Fotos do dono (removíveis) */}
        {ownerPhotos.map(photo => (
          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 group">
            <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            <button
              onClick={() => handleDelete(photo.id)}
              disabled={!!deleting}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remover foto"
            >
              {deleting === photo.id
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Trash2 className="w-5 h-5 text-white" />}
            </button>
          </div>
        ))}

        {/* Botão adicionar */}
        {canAddMore && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-white/30 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:text-emerald-500 transition-colors"
          >
            {uploading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><Upload className="w-5 h-5" /><span className="text-[10px] font-medium">Adicionar</span></>}
          </button>
        )}
      </div>

      {!canAddMore && (
        <p className="text-xs dash-muted">
          Você atingiu o limite de fotos do plano {plan}. Faça upgrade para adicionar mais.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
