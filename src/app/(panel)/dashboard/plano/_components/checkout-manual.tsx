"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Copy, Check, QrCode, CreditCard, CheckCircle } from "lucide-react"
import { PLAN_PRICE, PLAN_LABEL, PLAN_MONTHS, formatBRL, type PlanId } from "@/lib/plans"

interface Props {
  pixKey: string | null
  pixHolderName: string | null
  qrDataUrl: string | null
  mercadoPagoLink: string | null
  instructions: string | null
}

export function CheckoutManual({ pixKey, pixHolderName, qrDataUrl, mercadoPagoLink, instructions }: Props) {
  const [plan, setPlan] = useState<PlanId>("VISIBILITY")
  const [months, setMonths] = useState(1)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const total = PLAN_PRICE[plan] * months
  const hasPix = !!qrDataUrl || !!pixKey
  const hasCard = !!mercadoPagoLink

  function copyPix() {
    if (!pixKey) return
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function informarPagamento(method: "PIX" | "MERCADO_PAGO") {
    setLoading(method)
    try {
      const res = await fetch("/api/dashboard/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, method, months }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro"); return }
      setDone(true)
    } catch { toast.error("Erro de rede") } finally { setLoading(null) }
  }

  if (done) return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.06] p-8 text-center">
      <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
      <h3 className="font-serif text-xl font-semibold dash-title mb-2">Pagamento informado!</h3>
      <p className="text-sm dash-subtitle max-w-sm mx-auto">
        Vamos conferir o recebimento e liberar seu plano <strong>{PLAN_LABEL[plan]}</strong> em até 24h.
        Você recebe um email quando estiver ativo.
      </p>
    </div>
  )

  if (!hasPix && !hasCard) return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/[0.05] p-5 text-sm text-amber-800 dark:text-amber-300">
      Pagamentos ainda não foram configurados. Tente novamente em breve.
    </div>
  )

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-6 space-y-5">
      <h3 className="font-serif text-lg font-semibold dash-title">Assinar um plano</h3>

      {/* Seleção de plano */}
      <div className="grid grid-cols-2 gap-3">
        {(["VISIBILITY", "PREMIUM"] as PlanId[]).map(p => (
          <button key={p} onClick={() => setPlan(p)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${plan === p ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-gray-200 dark:border-white/10 hover:border-gray-300"}`}>
            <p className="font-semibold dash-title">{PLAN_LABEL[p]}</p>
            <p className="text-sm dash-muted">{formatBRL(PLAN_PRICE[p] * 100)}/mês</p>
          </button>
        ))}
      </div>

      {/* Período */}
      <div>
        <label className="text-xs font-semibold dash-muted uppercase tracking-wide">Período</label>
        <div className="flex gap-2 mt-1.5">
          {PLAN_MONTHS.map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${months === m ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5"}`}>
              {m}{m === 1 ? " mês" : " meses"}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
        <span className="text-sm dash-subtitle">Total</span>
        <span className="font-serif text-2xl font-bold dash-title">{formatBRL(total * 100)}</span>
      </div>

      {/* PIX */}
      {hasPix && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-sm font-semibold dash-title">
            <QrCode className="w-4 h-4 text-emerald-500" /> Pagar com PIX
          </div>
          {qrDataUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Code PIX" className="w-44 h-44 rounded-xl border border-gray-100 dark:border-white/10" />
            </div>
          )}
          {pixKey && (
            <div>
              <p className="text-xs dash-muted mb-1">Chave PIX{pixHolderName ? ` · ${pixHolderName}` : ""}</p>
              <button onClick={copyPix} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm dash-title hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <span className="truncate font-mono text-xs">{pixKey}</span>
                {copied ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Copy className="w-4 h-4 dash-muted flex-shrink-0" />}
              </button>
            </div>
          )}
          <button onClick={() => informarPagamento("PIX")} disabled={!!loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {loading === "PIX" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Já paguei com PIX"}
          </button>
        </div>
      )}

      {/* Cartão */}
      {hasCard && (
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2 text-sm font-semibold dash-title">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Pagar com cartão
          </div>
          <a href={mercadoPagoLink!} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold dash-title hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Abrir pagamento (Mercado Pago)
          </a>
          <button onClick={() => informarPagamento("MERCADO_PAGO")} disabled={!!loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {loading === "MERCADO_PAGO" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Já paguei com cartão"}
          </button>
        </div>
      )}

      {instructions && <p className="text-xs dash-muted text-center pt-2">{instructions}</p>}
    </div>
  )
}
