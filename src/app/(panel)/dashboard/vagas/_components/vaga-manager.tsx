"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Briefcase, Plus, Pencil, Trash2, Loader2, Save, X, Eye, EyeOff, ChevronDown } from "lucide-react"

export interface Vaga {
  id: string
  title: string
  description: string
  type: string | null
  email: string | null
  showWhatsapp: boolean
  active: boolean
}

const TYPES = ["CLT", "PJ", "Estágio", "Freela", "Temporário", "Outro"]

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const labelCls = "text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide"

interface Draft { title: string; type: string; description: string; email: string; showWhatsapp: boolean; active: boolean }
const emptyDraft: Draft = { title: "", type: "", description: "", email: "", showWhatsapp: true, active: true }

export function VagaManager({ vagas: initial, limit, plan }: { vagas: Vaga[]; limit: number; plan: string }) {
  const [vagas, setVagas] = useState<Vaga[]>(initial)
  const [editing, setEditing] = useState<string | null>(null) // id, "new" ou null
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)

  const atLimit = vagas.length >= limit

  function startNew() { setDraft(emptyDraft); setEditing("new") }
  function startEdit(v: Vaga) {
    setDraft({ title: v.title, type: v.type ?? "", description: v.description, email: v.email ?? "", showWhatsapp: v.showWhatsapp, active: v.active })
    setEditing(v.id)
  }
  function cancel() { setEditing(null); setDraft(emptyDraft) }

  async function save() {
    const title = draft.title.trim()
    const description = draft.description.trim()
    const email = draft.email.trim()
    if (!title || !description) { toast.error("Título e descrição são obrigatórios"); return }
    if (!draft.showWhatsapp && !email) { toast.error("Deixe ao menos um contato: WhatsApp ou e-mail"); return }
    const payload = { title, description, type: draft.type || null, email: email || null, showWhatsapp: draft.showWhatsapp, active: draft.active }
    setBusy(true)
    try {
      if (editing === "new") {
        const res = await fetch("/api/dashboard/vagas", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
        setVagas(vs => [...vs, { id: data.vaga.id, ...payload }])
        toast.success("Vaga publicada!")
      } else if (editing) {
        const res = await fetch(`/api/dashboard/vagas/${editing}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
        setVagas(vs => vs.map(v => v.id === editing ? { ...v, ...payload } : v))
        toast.success("Vaga atualizada!")
      }
      cancel()
    } catch { toast.error("Erro de rede") } finally { setBusy(false) }
  }

  async function toggleActive(v: Vaga) {
    const next = !v.active
    setVagas(vs => vs.map(x => x.id === v.id ? { ...x, active: next } : x))
    try {
      const res = await fetch(`/api/dashboard/vagas/${v.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: next }),
      })
      if (!res.ok) throw new Error()
      toast.success(next ? "Vaga ativada" : "Vaga pausada")
    } catch {
      setVagas(vs => vs.map(x => x.id === v.id ? { ...x, active: v.active } : x))
      toast.error("Erro ao atualizar")
    }
  }

  async function remove(v: Vaga) {
    if (!confirm(`Excluir a vaga "${v.title}"? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch(`/api/dashboard/vagas/${v.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setVagas(vs => vs.filter(x => x.id !== v.id))
      toast.success("Vaga excluída")
    } catch { toast.error("Erro ao excluir") }
  }

  const form = (
    <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-white/[0.02] p-5 space-y-3">
      <div className="grid sm:grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1">
          <label className={labelCls}>Título da vaga *</label>
          <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            placeholder="Ex.: Atendente de balcão" maxLength={120} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Tipo</label>
          <div className="relative sm:w-40">
            <select value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}
              className={inputCls + " appearance-none pr-9 cursor-pointer"}>
              <option value="">—</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-white/35" />
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelCls}>Descrição *</label>
        <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
          rows={5} maxLength={4000} placeholder="Requisitos, jornada, faixa salarial, como funciona a candidatura..."
          className={inputCls + " resize-none"} />
      </div>
      <div className="space-y-1.5 rounded-xl border border-gray-100 dark:border-white/[0.07] p-3">
        <p className={labelCls}>Como receber candidaturas</p>
        <input type="email" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
          placeholder="E-mail p/ candidatura (opcional) — ex.: vagas@seunegocio.com.br" maxLength={120} className={inputCls} />
        <label className="flex items-center gap-2 text-sm dash-title cursor-pointer pt-0.5">
          <input type="checkbox" checked={draft.showWhatsapp} onChange={e => setDraft(d => ({ ...d, showWhatsapp: e.target.checked }))}
            className="w-4 h-4 rounded accent-emerald-600" />
          Mostrar o WhatsApp do negócio
        </label>
        <p className="text-[11px] dash-muted">Deixe pelo menos um visível. Marcando os dois, aparecem os dois.</p>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm dash-title cursor-pointer">
          <input type="checkbox" checked={draft.active} onChange={e => setDraft(d => ({ ...d, active: e.target.checked }))}
            className="w-4 h-4 rounded accent-emerald-600" />
          Publicada (visível no perfil e em /vagas)
        </label>
        <div className="flex items-center gap-2">
          <button onClick={cancel} disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={save} disabled={busy}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar</>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm dash-subtitle">
          <span className="font-semibold dash-title">{vagas.length}</span> de {limit} vagas usadas
        </p>
        <button onClick={startNew} disabled={atLimit || editing === "new"}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Nova vaga
        </button>
      </div>
      {atLimit && editing !== "new" && (
        <p className="text-xs text-amber-600 dark:text-amber-400 -mt-2">
          Limite de {limit} vagas do plano {plan} atingido. Pause/exclua uma vaga ou faça upgrade para abrir espaço.
        </p>
      )}

      {/* Form de nova vaga (topo) */}
      {editing === "new" && form}

      {/* Lista */}
      {vagas.length === 0 && editing !== "new" ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
          <Briefcase className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
          <p className="text-sm dash-subtitle">Nenhuma vaga ainda. Clique em <strong>Nova vaga</strong> para publicar a primeira.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vagas.map(v => editing === v.id ? (
            <div key={v.id}>{form}</div>
          ) : (
            <div key={v.id} className={`rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4 flex items-start justify-between gap-3 ${!v.active ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold dash-title leading-tight">{v.title}</h3>
                  {v.type && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">{v.type}</span>}
                  {!v.active && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40">Pausada</span>}
                </div>
                <p className="text-sm dash-subtitle mt-1 line-clamp-2 whitespace-pre-wrap">{v.description}</p>
                <p className="text-[11px] dash-muted mt-1.5">
                  Contato: {[v.showWhatsapp && "WhatsApp", v.email && "E-mail"].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(v)} title={v.active ? "Pausar" : "Ativar"}
                  className="p-2 rounded-lg text-gray-400 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white transition-colors">
                  {v.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(v)} title="Editar"
                  className="p-2 rounded-lg text-gray-400 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(v)} title="Excluir"
                  className="p-2 rounded-lg text-gray-400 dark:text-white/35 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
