"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, Calendar, MapPin, Building2, Eye } from "lucide-react"

export interface ModItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverUrl: string | null
  eventDate: string | null
  eventLocation: string | null
  businessName: string
  createdAt: string
}

export function EventModeration({ events }: { events: ModItem[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState("")

  async function act(id: string, action: "approve" | "reject") {
    setLoading(id + action)
    try {
      const res = await fetch(`/api/admin/eventos/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: action === "reject" ? note : undefined }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      toast.success(action === "approve" ? "Evento publicado!" : "Evento devolvido para ajuste")
      setRejecting(null); setNote("")
      router.refresh()
    } finally { setLoading(null) }
  }

  if (events.length === 0) return (
    <div className="text-center py-16 text-gray-400 dark:text-white/30">
      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-medium">Nenhum evento aguardando moderação</p>
    </div>
  )

  const fmt = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : "Sem data"

  return (
    <div className="space-y-3">
      {events.map(e => (
        <div key={e.id} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-3">
          <div className="flex gap-4">
            <div className="w-28 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 flex-shrink-0">
              {e.coverUrl && <img src={e.coverUrl} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold dash-title">{e.title}</p>
              <p className="text-xs dash-muted flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" /> {e.businessName}</p>
              <p className="text-xs dash-muted flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {fmt(e.eventDate)}</p>
              {e.eventLocation && <p className="text-xs dash-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {e.eventLocation}</p>}
              {e.excerpt && <p className="text-sm dash-subtitle mt-1.5 line-clamp-2">{e.excerpt}</p>}
            </div>
          </div>

          {rejecting === e.id ? (
            <div className="space-y-2">
              <textarea value={note} onChange={ev => setNote(ev.target.value)} rows={2} placeholder="O que precisa ajustar? (vai por email ao lojista)"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => act(e.id, "reject")} disabled={!!loading} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-1.5">
                  {loading === e.id + "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enviar ajuste"}
                </button>
                <button onClick={() => { setRejecting(null); setNote("") }} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle text-sm">Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <a href={`/eventos/${e.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-medium transition-colors">
                <Eye className="w-3.5 h-3.5" /> Preview
              </a>
              <button onClick={() => act(e.id, "approve")} disabled={!!loading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {loading === e.id + "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Aprovar e publicar
              </button>
              <button onClick={() => setRejecting(e.id)} disabled={!!loading} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 text-sm font-medium transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Pedir ajuste
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
