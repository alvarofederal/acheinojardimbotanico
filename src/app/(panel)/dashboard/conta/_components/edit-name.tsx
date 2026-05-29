"use client"

import { useState } from "react"
import { Loader2, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function EditName({ currentName }: { currentName: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName ?? "")
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (name.trim().length < 2) { toast.error("Nome deve ter ao menos 2 caracteres"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/conta/nome", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success("Nome atualizado")
      setEditing(false)
      router.refresh()
    } catch {
      toast.error("Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  if (!editing) return (
    <div className="flex items-center justify-between">
      <span className="dash-muted text-sm">Nome</span>
      <div className="flex items-center gap-2">
        <span className="dash-subtitle text-sm">{currentName ?? "—"}</span>
        <button onClick={() => setEditing(true)}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <Pencil className="w-3.5 h-3.5 dash-muted" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false) }}
        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500 transition-colors"
        placeholder="Seu nome"
        maxLength={100}
      />
      <button onClick={handleSave} disabled={loading}
        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button onClick={() => { setEditing(false); setName(currentName ?? "") }}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
        <X className="w-3.5 h-3.5 dash-muted" />
      </button>
    </div>
  )
}
