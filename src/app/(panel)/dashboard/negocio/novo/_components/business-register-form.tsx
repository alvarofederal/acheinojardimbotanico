"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, MapPin, Check, Store } from "lucide-react"

interface Category { id: string; name: string }
interface Suggestion {
  label: string; address: string; lat: number; lng: number
  neighborhood: string; city: string; state: string
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const labelCls = "block text-xs font-semibold mb-1.5 uppercase tracking-wide text-gray-500 dark:text-white/40"

export function BusinessRegisterForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "", categoryId: "", phone: "", whatsapp: "", description: "",
  })

  // Endereço / autocomplete
  const [addrQuery, setAddrQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<Suggestion | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (picked && addrQuery === picked.address) return // já selecionado
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

  function selectSuggestion(s: Suggestion) {
    setPicked(s)
    setAddrQuery(s.address)
    setOpen(false)
  }

  function set(f: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(s => ({ ...s, [f]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error("Informe o nome do negócio")
    if (!form.categoryId) return toast.error("Escolha uma categoria")
    if (!picked) return toast.error("Selecione o endereço na lista de sugestões")

    setSaving(true)
    try {
      const res = await fetch("/api/dashboard/negocio/novo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, categoryId: form.categoryId,
          address: picked.address, neighborhood: picked.neighborhood,
          city: picked.city, state: picked.state,
          latitude: picked.lat, longitude: picked.lng,
          phone: form.phone || undefined, whatsapp: form.whatsapp || undefined,
          description: form.description || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao cadastrar"); return }
      toast.success("Negócio enviado! Aguarde a aprovação do admin.")
      router.push("/dashboard/negocio")
      router.refresh()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
        <div>
          <label className={labelCls}>Nome do negócio *</label>
          <input value={form.name} onChange={set("name")} placeholder="Ex: Ateliê da Ana" className={inputCls} required />
        </div>

        <div>
          <label className={labelCls}>Categoria *</label>
          <select value={form.categoryId} onChange={set("categoryId")} className={inputCls} required>
            <option value="">Selecione...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Endereço com autocomplete */}
        <div className="relative">
          <label className={labelCls}>Endereço *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              value={addrQuery}
              onChange={e => { setAddrQuery(e.target.value); setPicked(null) }}
              onFocus={() => suggestions.length && setOpen(true)}
              placeholder="Digite a rua e o número..."
              autoComplete="off"
              className={inputCls + " pl-10"}
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />}
            {picked && !searching && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
          </div>

          {open && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1c18] shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button type="button" onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-3 py-2.5 text-sm dash-title hover:bg-gray-50 dark:hover:bg-white/5 flex items-start gap-2 transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs dash-muted mt-1">
            {picked
              ? `📍 ${picked.neighborhood || picked.city} · coordenadas capturadas`
              : "Escolha uma opção da lista — usamos a localização para o mapa do perfil."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Telefone</label>
            <input value={form.phone} onChange={set("phone")} placeholder="(61) 9..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>WhatsApp</label>
            <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="(61) 9..." className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Descrição</label>
          <textarea value={form.description} onChange={set("description")} rows={3}
            placeholder="Conte o que seu negócio oferece..." className={inputCls + " resize-none"} />
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <><Store className="w-4 h-4" />Cadastrar negócio</>}
      </button>
      <p className="text-xs dash-muted">Seu negócio passará por uma rápida aprovação antes de aparecer no guia.</p>
    </form>
  )
}
