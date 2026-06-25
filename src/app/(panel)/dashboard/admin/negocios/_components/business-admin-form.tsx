"use client"

import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, MapPin, Check, Save, Link2, Image as ImageIcon, Upload, Trash2, Power, PowerOff } from "lucide-react"
import { slugify } from "@/lib/utils"

interface Category { id: string; name: string }
interface Suggestion { label: string; address: string; lat: number; lng: number; neighborhood: string; city: string; state: string }

export interface BusinessInitial {
  name: string; categoryId: string
  phone: string; whatsapp: string; website: string; instagram: string; description: string
  address: string; neighborhood: string; city: string; state: string
  plan: "FREE" | "VISIBILITY" | "PREMIUM"
  handle: string; active: boolean; logoUrl: string | null
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const labelCls = "block text-xs font-semibold mb-1.5 uppercase tracking-wide text-gray-500 dark:text-white/40"
const HOST = "acheinojardimbotanico.com.br"

export function BusinessAdminForm({
  mode, categories, businessId, initial,
}: {
  mode: "create" | "edit"
  categories: Category[]
  businessId?: string
  initial?: BusinessInitial
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: initial?.name ?? "", categoryId: initial?.categoryId ?? "",
    phone: initial?.phone ?? "", whatsapp: initial?.whatsapp ?? "",
    website: initial?.website ?? "", instagram: initial?.instagram ?? "",
    description: initial?.description ?? "", plan: initial?.plan ?? "FREE",
  })
  const [active, setActive] = useState(initial?.active ?? true)
  const [handle, setHandle] = useState(initial?.handle ?? "")

  // Endereço / autocomplete (geocode)
  const [addrQuery, setAddrQuery] = useState(initial?.address ?? "")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<Suggestion | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Logo (só edição)
  const [logo, setLogo] = useState<string | null>(initial?.logoUrl ?? null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (picked && addrQuery === picked.address) return
    if (addrQuery.trim().length < 3) { setSuggestions([]); return }
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(addrQuery)}`)
        const data = await res.json()
        setSuggestions(data.suggestions ?? [])
        setOpen(true)
      } catch { setSuggestions([]) } finally { setSearching(false) }
    }, 350)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [addrQuery, picked])

  function set(f: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(s => ({ ...s, [f]: e.target.value }))
  }
  function cleanHandle(v: string) { return v.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 40) }

  async function onPickLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !businessId) return
    setUploadingLogo(true)
    try {
      const fd = new FormData(); fd.append("file", file)
      const r = await fetch(`/api/admin/negocios/${businessId}/logo`, { method: "POST", body: fd })
      const dd = await r.json()
      if (!r.ok) { toast.error(dd.error ?? "Erro no upload"); return }
      setLogo(dd.url); toast.success("Logo atualizada")
    } catch { toast.error("Erro de rede") } finally { setUploadingLogo(false); if (fileRef.current) fileRef.current.value = "" }
  }
  async function removeLogo() {
    if (!businessId) return
    setUploadingLogo(true)
    try {
      const r = await fetch(`/api/admin/negocios/${businessId}/logo`, { method: "DELETE" })
      if (!r.ok) { toast.error("Erro ao remover"); return }
      setLogo(null); toast.success("Logo removida")
    } catch { toast.error("Erro de rede") } finally { setUploadingLogo(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.name.trim().length < 2) return toast.error("Informe o nome do negócio")
    if (!form.categoryId) return toast.error("Escolha uma categoria")
    if (mode === "create" && !picked) return toast.error("Selecione o endereço na lista de sugestões")

    setSaving(true)
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/negocios", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name, categoryId: form.categoryId,
            address: picked!.address, neighborhood: picked!.neighborhood, city: picked!.city, state: picked!.state,
            latitude: picked!.lat, longitude: picked!.lng,
            phone: form.phone || undefined, whatsapp: form.whatsapp || undefined,
            website: form.website || undefined, instagram: form.instagram || undefined,
            description: form.description || undefined,
            plan: form.plan, status: active ? "IMPORTED" : "SUSPENDED",
          }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? "Erro ao cadastrar"); return }
        toast.success("Negócio cadastrado!")
        router.push("/dashboard/admin/negocios"); router.refresh()
        return
      }

      // EDIT
      const fields: Record<string, unknown> = {
        name: form.name, categoryId: form.categoryId,
        phone: form.phone, whatsapp: form.whatsapp, website: form.website,
        instagram: form.instagram, description: form.description, plan: form.plan,
      }
      if (picked) Object.assign(fields, { address: picked.address, neighborhood: picked.neighborhood, city: picked.city, state: picked.state, latitude: picked.lat, longitude: picked.lng })
      const r1 = await fetch(`/api/admin/negocios/${businessId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) })
      const d1 = await r1.json()
      if (!r1.ok) { toast.error(d1.error ?? "Erro ao salvar"); return }

      if (handle !== (initial?.handle ?? "")) {
        const r2 = await fetch(`/api/admin/negocios/${businessId}/handle`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle }) })
        const d2 = await r2.json()
        if (!r2.ok) { toast.error(d2.error ?? "Erro no slug"); return }
      }
      if (active !== (initial?.active ?? true)) {
        const r3 = await fetch(`/api/admin/negocios/${businessId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: active ? "activate" : "deactivate" }) })
        const d3 = await r3.json()
        if (!r3.ok) { toast.error(d3.error ?? "Erro no status"); return }
      }
      toast.success("Negócio atualizado!")
      router.push("/dashboard/admin/negocios"); router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  const suggested = slugify(form.name).slice(0, 40)

  return (
    <form onSubmit={submit} className="space-y-5 max-w-2xl">
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome *</label>
            <input value={form.name} onChange={set("name")} placeholder="Ex: Ateliê da Ana" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Categoria *</label>
            <select value={form.categoryId} onChange={set("categoryId")} className={inputCls} required>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Endereço com autocomplete (geocode) */}
        <div className="relative">
          <label className={labelCls}>Endereço {mode === "create" ? "*" : "(deixe como está ou busque outro)"}</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input value={addrQuery} onChange={e => { setAddrQuery(e.target.value); setPicked(null) }}
              onFocus={() => suggestions.length && setOpen(true)} placeholder="Digite a rua e o número..." autoComplete="off" className={inputCls + " pl-10"} />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />}
            {picked && !searching && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
          </div>
          {open && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1c18] shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button type="button" onClick={() => { setPicked(s); setAddrQuery(s.address); setOpen(false) }}
                    className="w-full text-left px-3 py-2.5 text-sm dash-title hover:bg-gray-50 dark:hover:bg-white/5 flex items-start gap-2 transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> <span>{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs dash-muted mt-1">{picked ? `📍 ${picked.neighborhood || picked.city} · coordenadas capturadas` : mode === "edit" ? "Só busque um novo endereço se quiser mudar a localização." : "Escolha uma opção da lista (pega as coordenadas pro mapa)."}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={labelCls}>Telefone</label><input value={form.phone} onChange={set("phone")} placeholder="(61) 3333-3333" className={inputCls} /></div>
          <div><label className={labelCls}>WhatsApp</label><input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+5561999999999" className={inputCls} /></div>
          <div><label className={labelCls}>Site</label><input value={form.website} onChange={set("website")} placeholder="https://..." className={inputCls} /></div>
          <div><label className={labelCls}>Instagram</label><input value={form.instagram} onChange={set("instagram")} placeholder="@negocio" className={inputCls} /></div>
        </div>

        <div>
          <label className={labelCls}>Descrição</label>
          <textarea value={form.description} onChange={set("description")} rows={3} placeholder="O que o negócio oferece..." className={inputCls + " resize-none"} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Plano</label>
            <select value={form.plan} onChange={set("plan")} className={inputCls}>
              <option value="FREE">Free</option>
              <option value="VISIBILITY">Visibilidade</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setActive(true)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${active ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-200 dark:border-white/10 dash-subtitle"}`}><Power className="w-4 h-4" /> Ativo</button>
              <button type="button" onClick={() => setActive(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${!active ? "bg-red-600 border-red-600 text-white" : "border-gray-200 dark:border-white/10 dash-subtitle"}`}><PowerOff className="w-4 h-4" /> Inativo</button>
            </div>
          </div>
        </div>
      </div>

      {/* Edição: slug + logo */}
      {mode === "edit" && (
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
          <div>
            <label className={labelCls + " flex items-center gap-1.5"}><Link2 className="w-3.5 h-3.5" /> Link curto (slug)</label>
            <div className="flex items-stretch rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden focus-within:border-emerald-500 transition-colors">
              <span className="flex items-center px-3 text-xs dash-muted bg-gray-50 dark:bg-white/[0.03] border-r border-gray-200 dark:border-white/10 whitespace-nowrap">{HOST}/</span>
              <input value={handle} onChange={e => setHandle(cleanHandle(e.target.value))} placeholder={suggested} className="flex-1 px-3 py-2.5 bg-transparent text-sm dash-title focus:outline-none" />
            </div>
          </div>
          <div>
            <label className={labelCls + " flex items-center gap-1.5"}><ImageIcon className="w-3.5 h-3.5" /> Logo do cartão</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white flex items-center justify-center flex-shrink-0">
                {logo ? <img src={logo} alt="logo" className="w-full h-full object-contain" /> : <ImageIcon className="w-5 h-5 text-gray-300 dark:text-white/20" />}
              </div>
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingLogo} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors">
                  {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {logo ? "Trocar" : "Subir logo"}
                </button>
                {logo && <button type="button" onClick={removeLogo} disabled={uploadingLogo} className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-60"><Trash2 className="w-3.5 h-3.5" /> Remover</button>}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onPickLogo} className="hidden" />
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> {mode === "create" ? "Cadastrar negócio" : "Salvar alterações"}</>}
      </button>
    </form>
  )
}
