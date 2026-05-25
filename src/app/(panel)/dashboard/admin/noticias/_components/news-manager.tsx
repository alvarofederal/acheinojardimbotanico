"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Loader2, Upload, X, Star, Eye, EyeOff } from "lucide-react"

export interface NewsItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverUrl: string | null
  status: string
  featured: boolean
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const label = "text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide"
const empty: NewsItem = { id: "", title: "", slug: "", excerpt: "", content: "", coverUrl: "", status: "DRAFT", featured: false }

export function NewsManager({ news }: { news: NewsItem[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<NewsItem | null>(null)

  async function remove(id: string) {
    if (!confirm("Excluir esta notícia?")) return
    const res = await fetch(`/api/admin/noticias/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Excluída"); router.refresh() } else toast.error("Erro")
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...empty })} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Nova notícia
        </button>
      </div>

      {news.length === 0 ? (
        <p className="text-center py-12 dash-muted text-sm">Nenhuma notícia ainda.</p>
      ) : (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] divide-y divide-gray-50 dark:divide-white/[0.04]">
          {news.map(n => (
            <div key={n.id} className="flex items-center gap-3 p-3">
              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
                {n.coverUrl && <img src={n.coverUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium dash-title truncate flex items-center gap-1.5">
                  {n.featured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                  {n.title}
                </p>
                <p className="text-xs dash-muted">{n.status === "PUBLISHED" ? "Publicada" : "Rascunho"}</p>
              </div>
              <button onClick={() => setEditing(n)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><Pencil className="w-4 h-4 dash-muted" /></button>
              <button onClick={() => remove(n.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
            </div>
          ))}
        </div>
      )}

      {editing && <NewsEditor item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />}
    </div>
  )
}

function NewsEditor({ item, onClose, onSaved }: { item: NewsItem; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(item)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = !!item.id

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      setForm(f => ({ ...f, coverUrl: data.imageUrl }))
    } finally { setUploading(false) }
  }

  async function save(publish: boolean) {
    if (form.title.trim().length < 3 || !form.content.trim()) { toast.error("Preencha título e conteúdo"); return }
    setSaving(true)
    const payload = { title: form.title, excerpt: form.excerpt ?? "", content: form.content, coverUrl: form.coverUrl ?? "", featured: form.featured, publish }
    try {
      const res = await fetch(isEdit ? `/api/admin/noticias/${form.id}` : "/api/admin/noticias", {
        method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      toast.success(publish ? "Publicada!" : "Salva como rascunho")
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg my-8 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold dash-title">{isEdit ? "Editar notícia" : "Nova notícia"}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
        </div>

        <div className="space-y-1.5">
          <label className={label}>Capa</label>
          <div className="flex items-center gap-3">
            {form.coverUrl ? (
              <div className="relative w-24 h-16 rounded-lg overflow-hidden">
                <img src={form.coverUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setForm(f => ({ ...f, coverUrl: "" }))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-24 h-16 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:border-emerald-400">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
        </div>

        <div className="space-y-1.5"><label className={label}>Título</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} /></div>
        <div className="space-y-1.5"><label className={label}>Resumo</label>
          <textarea value={form.excerpt ?? ""} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} className={inputCls + " resize-none"} /></div>
        <div className="space-y-1.5"><label className={label}>Conteúdo</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} placeholder="Escreva a notícia. Cada linha em branco separa um parágrafo." className={inputCls + " resize-none"} /></div>

        <label className="flex items-center gap-2 text-sm dash-subtitle cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
          Destaque (banner grande)
        </label>

        <div className="flex gap-2 pt-2">
          <button onClick={() => save(true)} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Eye className="w-4 h-4" /> Publicar</>}
          </button>
          <button onClick={() => save(false)} disabled={saving} className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <EyeOff className="w-4 h-4" /> Rascunho
          </button>
        </div>
      </div>
    </div>
  )
}
