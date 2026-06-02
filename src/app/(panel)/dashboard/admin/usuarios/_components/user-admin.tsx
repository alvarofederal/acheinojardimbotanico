"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus, Pencil, Trash2, X, Loader2 } from "lucide-react"

const ROLES = [
  { value: "VISITOR", label: "Visitante" },
  { value: "ADVERTISER", label: "Anunciante" },
  { value: "ADMIN", label: "Admin" },
] as const

type Role = (typeof ROLES)[number]["value"]

/* ───────────────────────── Criar usuário ───────────────────────── */
export function NewUserButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "ADVERTISER" as Role, password: "" })

  async function create() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao criar"); return }
      toast.success("Usuário criado")
      setOpen(false)
      setForm({ name: "", email: "", role: "ADVERTISER", password: "" })
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
        <UserPlus className="w-4 h-4" /> Novo usuário
      </button>

      {open && (
        <Modal title="Novo usuário" onClose={() => setOpen(false)}>
          <Field label="Nome">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} placeholder="Nome completo" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={inputCls} placeholder="email@exemplo.com" />
          </Field>
          <Field label="Papel">
            <RoleSelect value={form.role} onChange={r => setForm(f => ({ ...f, role: r }))} />
          </Field>
          <Field label="Senha provisória">
            <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={inputCls} placeholder="Mín. 8 caracteres" />
          </Field>
          <button onClick={create} disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Criar usuário
          </button>
        </Modal>
      )}
    </>
  )
}

/* ──────────────────── Editar / excluir usuário ──────────────────── */
export function UserRowActions({ id, name, role, isSelf }: { id: string; name: string | null; role: string; isSelf: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: name ?? "", role: role as Role })

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success("Usuário atualizado")
      setEditing(false)
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  async function remove() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao excluir"); return }
      toast.success("Usuário excluído")
      setConfirming(false)
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <>
      <button onClick={() => setEditing(true)} title="Editar"
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
        <Pencil className="w-3.5 h-3.5 dash-muted" />
      </button>
      {!isSelf && (
        <button onClick={() => setConfirming(true)} title="Excluir"
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      )}

      {editing && (
        <Modal title="Editar usuário" onClose={() => setEditing(false)}>
          <Field label="Nome">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Papel">
            <RoleSelect value={form.role} onChange={r => setForm(f => ({ ...f, role: r }))} disabled={isSelf} />
          </Field>
          {isSelf && <p className="text-xs text-amber-500">Você não pode mudar o próprio papel.</p>}
          <button onClick={save} disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Salvar
          </button>
        </Modal>
      )}

      {confirming && (
        <Modal title="Excluir usuário" onClose={() => setConfirming(false)}>
          <p className="text-sm dash-subtitle">
            Tem certeza que deseja excluir <strong className="dash-title">{name ?? "este usuário"}</strong>?
            Os negócios dele voltam a ficar <strong>sem dono</strong>. Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 dash-subtitle text-sm font-medium">
              Cancelar
            </button>
            <button onClick={remove} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

/* ───────────────────────── helpers de UI ───────────────────────── */
const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500 transition-colors"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function RoleSelect({ value, onChange, disabled }: { value: Role; onChange: (r: Role) => void; disabled?: boolean }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as Role)} disabled={disabled}
      className={`${inputCls} disabled:opacity-50`}>
      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
    </select>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#0f1c18] rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold dash-title">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
            <X className="w-4 h-4 dash-muted" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
