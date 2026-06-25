"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, Check, X } from "lucide-react"
import { getCategoryIcon } from "@/lib/category-icons"

interface Cat {
  id: string; slug: string; name: string; iconName: string | null
  order: number; description: string | null; count: number
}

function IconPreview({ slug, iconName }: { slug: string; iconName: string | null }) {
  const Icon = getCategoryIcon(slug, iconName)
  return <Icon className="w-4 h-4 text-flora-green dark:text-flora-fresh" />
}

export function CategoryManager({ categories, iconKeys }: { categories: Cat[]; iconKeys: string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  // criar
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("")
  const [order, setOrder] = useState("")

  // editar
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ name: string; iconName: string; order: string }>({ name: "", iconName: "", order: "" })

  async function create() {
    if (name.trim().length < 2) { toast.error("Dê um nome à categoria"); return }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/categorias", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, iconName: icon || undefined, order: order ? Number(order) : undefined }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error ?? "Erro ao criar"); return }
      toast.success("Categoria criada")
      setName(""); setIcon(""); setOrder("")
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setBusy(false) }
  }

  function startEdit(c: Cat) {
    setEditId(c.id)
    setDraft({ name: c.name, iconName: c.iconName ?? "", order: String(c.order) })
  }

  async function saveEdit(id: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/categorias/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, iconName: draft.iconName || null, order: Number(draft.order) || 0 }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error ?? "Erro ao salvar"); return }
      toast.success("Categoria atualizada")
      setEditId(null)
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setBusy(false) }
  }

  async function remove(c: Cat) {
    if (c.count > 0) { toast.error(`Tem ${c.count} negócio(s) nessa categoria. Mova-os antes de apagar.`); return }
    if (!confirm(`Apagar a categoria "${c.name}"?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/categorias/${c.id}`, { method: "DELETE" })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error ?? "Erro ao apagar"); return }
      toast.success("Categoria apagada")
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setBusy(false) }
  }

  const iconSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] dash-title focus:outline-none focus:border-emerald-500 max-w-[150px]">
      <option value="">Ícone (auto pelo slug)</option>
      {iconKeys.map(k => <option key={k} value={k}>{k}</option>)}
    </select>
  )

  return (
    <div className="space-y-5">
      {/* Criar */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide dash-muted mb-3">Nova categoria</p>
        <div className="flex flex-wrap items-center gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome (ex.: Restaurantes)"
            className="flex-1 min-w-44 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500" />
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg bg-flora-green/10 flex items-center justify-center flex-shrink-0"><IconPreview slug="" iconName={icon} /></span>
            {iconSelect(icon, setIcon)}
          </div>
          <input value={order} onChange={e => setOrder(e.target.value.replace(/\D/g, ""))} placeholder="Ordem" inputMode="numeric"
            className="w-20 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500" />
          <button onClick={create} disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar
          </button>
        </div>
        <p className="text-[11px] dash-muted mt-2">O endereço (slug) é gerado do nome e não muda depois, pra não quebrar links. Menor ordem aparece primeiro.</p>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold dash-muted uppercase tracking-wide">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold dash-muted uppercase tracking-wide hidden sm:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold dash-muted uppercase tracking-wide">Ordem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold dash-muted uppercase tracking-wide">Negócios</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {categories.map(c => {
                const editing = editId === c.id
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-flora-green/10 flex items-center justify-center flex-shrink-0">
                          <IconPreview slug={c.slug} iconName={editing ? (draft.iconName || null) : c.iconName} />
                        </span>
                        {editing ? (
                          <input value={draft.name} onChange={e => setDraft(s => ({ ...s, name: e.target.value }))}
                            className="px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500" />
                        ) : (
                          <span className="font-medium dash-title">{c.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 dash-muted hidden sm:table-cell font-mono text-xs">{c.slug}</td>
                    <td className="px-4 py-2.5">
                      {editing ? (
                        <input value={draft.order} onChange={e => setDraft(s => ({ ...s, order: e.target.value.replace(/\D/g, "") }))} inputMode="numeric"
                          className="w-16 px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500" />
                      ) : (
                        <span className="dash-subtitle">{c.order}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 dash-subtitle">{c.count}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        {editing ? (
                          <>
                            {iconSelect(draft.iconName, v => setDraft(s => ({ ...s, iconName: v })))}
                            <button onClick={() => saveEdit(c.id)} disabled={busy} title="Salvar"
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditId(null)} title="Cancelar"
                              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 dash-muted hover:bg-gray-50 dark:hover:bg-white/5"><X className="w-3.5 h-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(c)} title="Editar"
                              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => remove(c)} title={c.count > 0 ? "Tem negócios — não dá pra apagar" : "Apagar"}
                              className={`p-1.5 rounded-lg border border-gray-200 dark:border-white/10 ${c.count > 0 ? "opacity-40 cursor-not-allowed" : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"}`}><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
