"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, Upload, X, Pencil, ImageIcon, Sparkles } from "lucide-react"
import { formatBRL } from "@/lib/plans"

type PriceMode = "FIXED" | "FROM" | "ON_REQUEST"
interface Variation { nome: string; opcoes: string[] }
export interface Product {
  id: string
  name: string
  description: string | null
  categoria: string | null
  priceMode: PriceMode
  priceCents: number | null
  promoPriceCents: number | null
  images: string[]
  variations: Variation[]
  soldOut: boolean
  featured: boolean
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const label = "text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide"

function priceLabel(p: Product) {
  if (p.priceMode === "ON_REQUEST") return "Sob consulta"
  if (p.promoPriceCents) return formatBRL(p.promoPriceCents)
  const v = formatBRL(p.priceCents ?? 0)
  return p.priceMode === "FROM" ? `A partir de ${v}` : v
}

const empty: Product = { id: "", name: "", description: "", categoria: "", priceMode: "FIXED", priceCents: 0, promoPriceCents: null, images: [], variations: [], soldOut: false, featured: false }

export function ProductManager({ products, limit, plan, hasLoja }: { products: Product[]; limit: number; plan: string; hasLoja: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Product | null>(null)
  const [open, setOpen] = useState(false)

  const canAdd = products.length < limit

  function startNew() { setEditing({ ...empty }); setOpen(true) }
  function startEdit(p: Product) { setEditing({ ...p }); setOpen(true) }

  async function remove(id: string) {
    if (!confirm("Remover este produto?")) return
    const res = await fetch(`/api/dashboard/produtos/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Produto removido"); router.refresh() }
    else toast.error("Erro ao remover")
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm dash-muted">{products.length}/{limit} produtos no plano {plan}</p>
        {canAdd && (
          <button onClick={startNew} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Adicionar produto
          </button>
        )}
      </div>

      {!canAdd && (
        <p className="text-xs dash-muted">Limite do plano atingido. Faça upgrade para adicionar mais produtos.</p>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
          <ImageIcon className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
          <p className="font-semibold dash-title mb-1">Sua vitrine está vazia</p>
          <p className="text-sm dash-subtitle">Adicione produtos para vender pelo WhatsApp direto do seu perfil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] overflow-hidden group">
              <div className="aspect-square bg-gray-100 dark:bg-white/5 relative">
                {p.images[0]
                  ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white/20"><ImageIcon className="w-8 h-8" /></div>}
                {p.soldOut && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">Esgotado</span>}
                {p.featured && hasLoja && <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-flora-gold text-flora-ink"><Sparkles className="w-2.5 h-2.5" />Destaque</span>}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => startEdit(p)} className="p-2 rounded-lg bg-white text-gray-700"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(p.id)} className="p-2 rounded-lg bg-white text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold dash-title truncate">{p.name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{priceLabel(p)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && editing && (
        <ProductForm product={editing} hasLoja={hasLoja} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); router.refresh() }} />
      )}
    </div>
  )
}

function ProductForm({ product, hasLoja, onClose, onSaved }: { product: Product; hasLoja: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Product>(product)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = !!product.id

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (form.images.length >= 4) { toast.error("Máximo de 4 fotos"); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro no upload"); return }
      setForm(f => ({ ...f, images: [...f.images, data.imageUrl] }))
    } catch { toast.error("Erro de rede") } finally { setUploading(false); if (fileRef.current) fileRef.current.value = "" }
  }

  function removeImg(i: number) { setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) })) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error("Informe o nome"); return }
    setSaving(true)
    const payload = {
      name: form.name, description: form.description ?? "", categoria: form.categoria ?? "",
      priceMode: form.priceMode, priceCents: form.priceCents ?? 0,
      promoPriceCents: form.priceMode !== "ON_REQUEST" && form.promoPriceCents ? form.promoPriceCents : null,
      images: form.images, variations: form.variations.filter(v => v.nome && v.opcoes.length), soldOut: form.soldOut,
      featured: form.featured,
    }
    try {
      const res = await fetch(isEdit ? `/api/dashboard/produtos/${form.id}` : "/api/dashboard/produtos", {
        method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success(isEdit ? "Produto atualizado" : "Produto adicionado")
      onSaved()
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  const priceReais = form.priceCents != null ? (form.priceCents / 100).toString() : ""
  const promoReais = form.promoPriceCents != null ? (form.promoPriceCents / 100).toString() : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <form onSubmit={save} className="w-full max-w-lg my-8 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold dash-title">{isEdit ? "Editar produto" : "Novo produto"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
        </div>

        {/* Fotos */}
        <div className="space-y-1.5">
          <label className={label}>Fotos (até 4)</label>
          <div className="flex gap-2 flex-wrap">
            {form.images.map((img, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImg(i)} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {form.images.length < 4 && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
        </div>

        <div className="space-y-1.5">
          <label className={label}>Nome</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Ex: Quadro personalizado A4" />
        </div>

        <div className="space-y-1.5">
          <label className={label}>Categoria (opcional)</label>
          <input value={form.categoria ?? ""} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inputCls} placeholder="Ex: Quadros, Doces..." />
        </div>

        <div className="space-y-1.5">
          <label className={label}>Descrição</label>
          <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputCls + " resize-none"} />
        </div>

        {/* Preço */}
        <div className="space-y-1.5">
          <label className={label}>Preço</label>
          <div className="flex gap-2">
            <select value={form.priceMode} onChange={e => setForm(f => ({ ...f, priceMode: e.target.value as PriceMode }))}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-sm dash-title">
              <option value="FIXED">Valor fixo</option>
              <option value="FROM">A partir de</option>
              <option value="ON_REQUEST">Sob consulta</option>
            </select>
            {form.priceMode !== "ON_REQUEST" && (
              <input type="number" step="0.01" min="0" value={priceReais}
                onChange={e => setForm(f => ({ ...f, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                className={inputCls} placeholder="R$ 0,00" />
            )}
          </div>
        </div>

        {/* Preço promocional */}
        {form.priceMode !== "ON_REQUEST" && (
          <div className="space-y-1.5">
            <label className={label}>Preço promocional (opcional)</label>
            <input type="number" step="0.01" min="0" value={promoReais}
              onChange={e => setForm(f => ({ ...f, promoPriceCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null }))}
              className={inputCls} placeholder="Deixe vazio se não estiver em oferta" />
            <p className="text-xs dash-muted">Se preenchido, o produto ganha selo &quot;Oferta&quot; e aparece na aba Promoções.</p>
          </div>
        )}

        {/* Esgotado */}
        <label className="flex items-center gap-2 text-sm dash-subtitle cursor-pointer">
          <input type="checkbox" checked={form.soldOut} onChange={e => setForm(f => ({ ...f, soldOut: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
          Marcar como esgotado
        </label>

        {/* Destaque na loja — só faz sentido se o plano tem loja */}
        {hasLoja && (
          <label className="flex items-center gap-2 text-sm dash-subtitle cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-flora-gold" />
            <Sparkles className="w-3.5 h-3.5 text-flora-gold" /> Destacar este produto na loja
          </label>
        )}

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar produto"}
          </button>
        </div>
      </form>
    </div>
  )
}
