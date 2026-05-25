"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save, ShieldCheck, Zap, Crown } from "lucide-react"
import { PLAN_FEATURES, type PlanConfigData, type PlanFeature, type PlanId } from "@/lib/plans"

interface Payment {
  pixKey: string | null
  pixHolderName: string | null
  pixCopyPaste: string | null
  mercadoPagoLink: string | null
  instructions: string | null
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:border-emerald-500 transition-colors"
const labelCls = "text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide"

const PLAN_ICON: Record<PlanId, { icon: typeof ShieldCheck; color: string; border: string }> = {
  FREE: { icon: ShieldCheck, color: "text-gray-500 dark:text-white/40", border: "border-gray-200 dark:border-white/10" },
  VISIBILITY: { icon: Zap, color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30" },
  PREMIUM: { icon: Crown, color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/30" },
}

// estado editável de um plano (reais como string para o input)
interface PlanForm {
  plan: PlanId
  label: string
  active: boolean
  order: number
  priceReais: string
  productLimit: string
  photoLimit: string
  features: Record<PlanFeature, boolean>
}

function toForm(p: PlanConfigData): PlanForm {
  return {
    plan: p.plan, label: p.label, active: p.active, order: p.order,
    priceReais: (p.priceCents / 100).toString(),
    productLimit: p.productLimit.toString(),
    photoLimit: p.photoLimit.toString(),
    features: { ...p.features },
  }
}

export function ConfigForm({ payment, plans }: { payment: Payment | null; plans: PlanConfigData[] }) {
  const [saving, setSaving] = useState(false)
  const [planForms, setPlanForms] = useState<PlanForm[]>(plans.map(toForm))
  const [pay, setPay] = useState({
    pixKey: payment?.pixKey ?? "",
    pixHolderName: payment?.pixHolderName ?? "",
    pixCopyPaste: payment?.pixCopyPaste ?? "",
    mercadoPagoLink: payment?.mercadoPagoLink ?? "",
    instructions: payment?.instructions ?? "",
  })

  function updatePlan(plan: PlanId, patch: Partial<PlanForm>) {
    setPlanForms(fs => fs.map(f => f.plan === plan ? { ...f, ...patch } : f))
  }
  function toggleFeature(plan: PlanId, key: PlanFeature) {
    setPlanForms(fs => fs.map(f => f.plan === plan ? { ...f, features: { ...f.features, [key]: !f.features[key] } } : f))
  }
  function setPayField(f: keyof typeof pay) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setPay(s => ({ ...s, [f]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/pagamento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment: pay,
          plans: planForms.map(f => ({
            plan: f.plan,
            label: f.label.trim() || f.plan,
            active: f.active,
            priceCents: Math.round(parseFloat(f.priceReais || "0") * 100),
            productLimit: Math.max(0, parseInt(f.productLimit || "0", 10)),
            photoLimit: Math.max(0, parseInt(f.photoLimit || "0", 10)),
            features: f.features,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return }
      toast.success("Configuração salva!")
    } catch { toast.error("Erro de rede") } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* ---- Planos ---- */}
      <div>
        <h2 className="text-sm font-semibold dash-title mb-3">Planos</h2>
        <div className="grid lg:grid-cols-3 gap-4">
          {planForms.map(f => {
            const meta = PLAN_ICON[f.plan]
            const isFree = f.plan === "FREE"
            return (
              <div key={f.plan} className={`rounded-2xl border-2 ${meta.border} bg-white dark:bg-white/[0.02] p-5 space-y-4 ${!f.active ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <meta.icon className={`w-5 h-5 ${meta.color}`} />
                    <input value={f.label} onChange={e => updatePlan(f.plan, { label: e.target.value })}
                      className="font-bold dash-title bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:border-emerald-500 focus:outline-none text-sm w-28" />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs dash-subtitle cursor-pointer">
                    <input type="checkbox" checked={f.active} onChange={e => updatePlan(f.plan, { active: e.target.checked })}
                      disabled={isFree}
                      className="w-4 h-4 rounded accent-emerald-600 disabled:opacity-40" />
                    Ativo
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className={labelCls}>R$/mês</label>
                    <input type="number" step="0.01" min="0" value={f.priceReais} disabled={isFree}
                      onChange={e => updatePlan(f.plan, { priceReais: e.target.value })}
                      className={inputCls + " disabled:opacity-50"} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Produtos</label>
                    <input type="number" min="0" value={f.productLimit}
                      onChange={e => updatePlan(f.plan, { productLimit: e.target.value })} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Fotos</label>
                    <input type="number" min="0" value={f.photoLimit}
                      onChange={e => updatePlan(f.plan, { photoLimit: e.target.value })} className={inputCls} />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <p className={labelCls}>Recursos</p>
                  {PLAN_FEATURES.map(feat => (
                    <label key={feat.key} className="flex items-start gap-2 cursor-pointer group" title={feat.description}>
                      <input type="checkbox" checked={f.features[feat.key]} onChange={() => toggleFeature(f.plan, feat.key)}
                        className="w-4 h-4 rounded accent-emerald-600 mt-0.5 flex-shrink-0" />
                      <span className="text-xs dash-title leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{feat.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        {planForms.find(f => f.plan === "FREE") && (
          <p className="text-xs dash-muted mt-2">O plano Free não pode ser desativado nem ter preço — é o piso de todo anunciante.</p>
        )}
      </div>

      {/* ---- Pagamento ---- */}
      <div>
        <h2 className="text-sm font-semibold dash-title mb-3">Como os anunciantes pagam</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-sm font-semibold dash-title">PIX</h3>
            <div className="space-y-1.5">
              <label className={labelCls}>Chave PIX</label>
              <input value={pay.pixKey} onChange={setPayField("pixKey")} placeholder="email, telefone, CNPJ ou aleatória" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Nome do recebedor</label>
              <input value={pay.pixHolderName} onChange={setPayField("pixHolderName")} placeholder="Álvaro / Achei JBT" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>PIX Copia e Cola (gera o QR)</label>
              <textarea value={pay.pixCopyPaste} onChange={setPayField("pixCopyPaste")} rows={3}
                placeholder="Cole o código copia-e-cola do app do banco" className={inputCls + " resize-none font-mono text-xs"} />
              <p className="text-xs dash-muted">App do banco → PIX → Receber → copia e cola. Vira o QR que o anunciante escaneia.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
              <h3 className="text-sm font-semibold dash-title">Cartão (Mercado Pago)</h3>
              <div className="space-y-1.5">
                <label className={labelCls}>Link de pagamento</label>
                <input value={pay.mercadoPagoLink} onChange={setPayField("mercadoPagoLink")} placeholder="https://mpago.la/..." className={inputCls} />
                <p className="text-xs dash-muted">Crie um link de cobrança no Mercado Pago e cole aqui.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-2">
              <h3 className="text-sm font-semibold dash-title">Instruções (opcional)</h3>
              <textarea value={pay.instructions} onChange={setPayField("instructions")} rows={2}
                placeholder="Ex: após pagar, clique em 'Já paguei'. Liberamos em até 24h." className={inputCls + " resize-none"} />
            </div>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors sticky bottom-4 shadow-lg">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</> : <><Save className="w-4 h-4" />Salvar tudo</>}
      </button>
    </form>
  )
}
