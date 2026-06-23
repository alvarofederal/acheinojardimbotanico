"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Business {
  id: string
  slug: string
  handle: string | null
  name: string
  description: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  youtube: string | null
  neighborhood: string
  address: string
  category: { slug: string; name: string }
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const labelCls = "text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide"

export function BusinessEditor({ business }: { business: Business }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    description: business.description ?? "",
    phone: business.phone ?? "",
    whatsapp: business.whatsapp ?? "",
    website: business.website ?? "",
    instagram: business.instagram ?? "",
    facebook: business.facebook ?? "",
    linkedin: business.linkedin ?? "",
    youtube: business.youtube ?? "",
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/negocio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success("Informações salvas!")
    } catch {
      toast.error("Erro de rede")
    } finally {
      setSaving(false)
    }
  }

  const bairroSlug = business.neighborhood.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-")

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Preview link */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-100 dark:border-emerald-500/20">
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{business.name}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">{business.category.name} · {business.neighborhood}</p>
        </div>
        <Link
          href={business.handle ? `/${business.handle}` : `/${bairroSlug}/${business.category.slug}/${business.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          Ver perfil <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <label className={labelCls}>Descrição</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={set("description")}
          placeholder="Conte sobre seu negócio, diferenciais, especialidades..."
          className={inputCls + " resize-none"}
        />
        <p className="text-xs text-gray-400 dark:text-white/25">{form.description.length}/500 caracteres</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* WhatsApp */}
        <div className="space-y-1.5">
          <label className={labelCls}>WhatsApp</label>
          <input type="tel" value={form.whatsapp} onChange={set("whatsapp")}
            placeholder="+5561999999999" className={inputCls} />
        </div>
        {/* Telefone */}
        <div className="space-y-1.5">
          <label className={labelCls}>Telefone</label>
          <input type="tel" value={form.phone} onChange={set("phone")}
            placeholder="(61) 3333-3333" className={inputCls} />
        </div>
        {/* Site */}
        <div className="space-y-1.5">
          <label className={labelCls}>Site</label>
          <input type="url" value={form.website} onChange={set("website")}
            placeholder="https://seusite.com.br" className={inputCls} />
        </div>
        {/* Instagram */}
        <div className="space-y-1.5">
          <label className={labelCls}>Instagram</label>
          <input type="text" value={form.instagram} onChange={set("instagram")}
            placeholder="@seunegocio" className={inputCls} />
        </div>
        {/* Facebook */}
        <div className="space-y-1.5">
          <label className={labelCls}>Facebook</label>
          <input type="url" value={form.facebook} onChange={set("facebook")}
            placeholder="https://facebook.com/seunegocio" className={inputCls} />
        </div>
        {/* LinkedIn */}
        <div className="space-y-1.5">
          <label className={labelCls}>LinkedIn</label>
          <input type="url" value={form.linkedin} onChange={set("linkedin")}
            placeholder="https://linkedin.com/company/..." className={inputCls} />
        </div>
        {/* YouTube */}
        <div className="space-y-1.5">
          <label className={labelCls}>YouTube</label>
          <input type="url" value={form.youtube} onChange={set("youtube")}
            placeholder="https://youtube.com/@seucanal" className={inputCls} />
        </div>
      </div>

      {/* Endereço (somente leitura — vem do Google) */}
      <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]">
        <p className="text-xs text-gray-400 dark:text-white/30 mb-1">Endereço (sincronizado com Google)</p>
        <p className="text-sm dash-subtitle">{business.address}</p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar alterações</>}
      </button>
    </form>
  )
}
