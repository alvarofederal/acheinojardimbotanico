"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Loader2, Upload, X, Clock, CheckCircle, XCircle } from "lucide-react"

export interface EventItem {
  id: string
  title: string
  excerpt: string | null
  content: string
  coverUrl: string | null
  status: string
  eventDate: string | null   // ISO ou ""
  eventLocation: string | null
  eventUrl: string | null
  moderationNote: string | null
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const label = "text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide"
const empty: EventItem = { id: "", title: "", excerpt: "", content: "", coverUrl: "", status: "", eventDate: "", eventLocation: "", eventUrl: "", moderationNote: null }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
    PENDING:   { label: "Em análise", cls: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: Clock },
    PUBLISHED: { label: "Publicado",  cls: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: CheckCircle },
    REJECTED:  { label: "Ajustar",    cls: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400", icon: XCircle },
  }
  const s = map[status] ?? map.PENDING
  return <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}><s.icon className="w-3 h-3" />{s.label}</span>
}

export function EventManager({ events }: { events: EventItem[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<EventItem | null>(null)

  async function remove(id: string) {
    if (!confirm("Excluir este evento?")) return
    const res = await fetch(`/api/dashboard/eventos/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Excluído"); router.refresh() } else toast.error("Erro")
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...empty })} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Novo evento
        </button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
          <p className="font-semibold dash-title mb-1">Nenhum evento ainda</p>
          <p className="text-sm dash-subtitle">Crie um evento — ele passa por uma rápida moderação e vai pra agenda do bairro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(e => (
            <div key={e.id} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
                  {e.coverUrl && <img src={e.coverUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium dash-title truncate">{e.title}</p>
                  <div className="mt-0.5"><StatusBadge status={e.status} /></div>
                </div>
                <button onClick={() => setEditing(e)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><Pencil className="w-4 h-4 dash-muted" /></button>
                <button onClick={() => remove(e.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
              {e.status === "REJECTED" && e.moderationNote && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg p-2">
                  <strong>Ajuste pedido:</strong> {e.moderationNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && <EventEditor item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />}
    </div>
  )
}

function EventEditor({ item, onClose, onSaved }: { item: EventItem; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    ...item,
    eventDate: item.eventDate ? item.eventDate.slice(0, 16) : "", // datetime-local
  })
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

  async function save() {
    if (form.title.trim().length < 3 || !form.content.trim()) { toast.error("Preencha título e descrição"); return }
    setSaving(true)
    const payload = {
      title: form.title, excerpt: form.excerpt ?? "", content: form.content, coverUrl: form.coverUrl ?? "",
      eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : "",
      eventLocation: form.eventLocation ?? "", eventUrl: form.eventUrl ?? "",
    }
    try {
      const res = await fetch(isEdit ? `/api/dashboard/eventos/${form.id}` : "/api/dashboard/eventos", {
        method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      toast.success("Evento enviado para análise!")
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg my-8 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold dash-title">{isEdit ? "Editar evento" : "Novo evento"}</h3>
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><label className={label}>Data e hora</label>
            <input type="datetime-local" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} className={inputCls} /></div>
          <div className="space-y-1.5"><label className={label}>Local</label>
            <input value={form.eventLocation ?? ""} onChange={e => setForm(f => ({ ...f, eventLocation: e.target.value }))} placeholder="Endereço/local" className={inputCls} /></div>
        </div>

        <div className="space-y-1.5"><label className={label}>Link de inscrição (opcional)</label>
          <input type="url" value={form.eventUrl ?? ""} onChange={e => setForm(f => ({ ...f, eventUrl: e.target.value }))} placeholder="https://..." className={inputCls} /></div>

        <div className="space-y-1.5"><label className={label}>Resumo</label>
          <textarea value={form.excerpt ?? ""} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} className={inputCls + " resize-none"} /></div>
        <div className="space-y-1.5"><label className={label}>Descrição</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6} className={inputCls + " resize-none"} /></div>

        <p className="text-xs dash-muted">Ao enviar, o evento passa por uma moderação rápida antes de aparecer no site.</p>

        <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar para análise"}
        </button>
      </div>
    </div>
  )
}
