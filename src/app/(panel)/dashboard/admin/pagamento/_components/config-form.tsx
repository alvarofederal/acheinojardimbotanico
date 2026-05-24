"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

interface Config {
  pixKey: string | null
  pixHolderName: string | null
  pixCopyPaste: string | null
  mercadoPagoLink: string | null
  instructions: string | null
  visibilityCents: number
  premiumCents: number
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const labelCls = "text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide"

export function ConfigForm({ config }: { config: Config | null }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    pixKey: config?.pixKey ?? "",
    pixHolderName: config?.pixHolderName ?? "",
    pixCopyPaste: config?.pixCopyPaste ?? "",
    mercadoPagoLink: config?.mercadoPagoLink ?? "",
    instructions: config?.instructions ?? "",
    visibilityReais: ((config?.visibilityCents ?? 7900) / 100).toString(),
    premiumReais: ((config?.premiumCents ?? 19700) / 100).toString(),
  })

  function set(f: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(s => ({ ...s, [f]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/pagamento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixKey: form.pixKey, pixHolderName: form.pixHolderName, pixCopyPaste: form.pixCopyPaste,
          mercadoPagoLink: form.mercadoPagoLink, instructions: form.instructions,
          visibilityCents: Math.round(parseFloat(form.visibilityReais || "0") * 100),
          premiumCents: Math.round(parseFloat(form.premiumReais || "0") * 100),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success("Configuração salva!")
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-xl">
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-title">Preços dos planos (por mês)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Visibilidade (R$)</label>
            <input type="number" step="0.01" min="0" value={form.visibilityReais} onChange={set("visibilityReais")} placeholder="79.00" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Premium (R$)</label>
            <input type="number" step="0.01" min="0" value={form.premiumReais} onChange={set("premiumReais")} placeholder="197.00" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-title">PIX</h2>
        <div className="space-y-1.5">
          <label className={labelCls}>Chave PIX</label>
          <input value={form.pixKey} onChange={set("pixKey")} placeholder="email, telefone, CNPJ ou chave aleatória" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Nome do recebedor</label>
          <input value={form.pixHolderName} onChange={set("pixHolderName")} placeholder="Álvaro / Achei JBT" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>PIX Copia e Cola (gera o QR Code)</label>
          <textarea value={form.pixCopyPaste} onChange={set("pixCopyPaste")} rows={3}
            placeholder="Cole aqui o código copia-e-cola do seu app do banco" className={inputCls + " resize-none font-mono text-xs"} />
          <p className="text-xs dash-muted">Gere no app do seu banco (PIX → Receber → copia e cola). Vira o QR Code que o anunciante escaneia.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-title">Cartão (Mercado Pago)</h2>
        <div className="space-y-1.5">
          <label className={labelCls}>Link de pagamento</label>
          <input value={form.mercadoPagoLink} onChange={set("mercadoPagoLink")} placeholder="https://mpago.la/..." className={inputCls} />
          <p className="text-xs dash-muted">Crie um link de cobrança no Mercado Pago e cole aqui (aceita cartão de crédito).</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-title">Instruções (opcional)</h2>
        <textarea value={form.instructions} onChange={set("instructions")} rows={2}
          placeholder="Ex: após pagar, clique em 'Já paguei'. Liberamos em até 24h." className={inputCls + " resize-none"} />
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar configuração</>}
      </button>
    </form>
  )
}
