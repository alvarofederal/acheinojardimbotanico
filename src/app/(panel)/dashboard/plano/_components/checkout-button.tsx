"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"

interface CheckoutButtonProps {
  plan: "VISIBILITY" | "PREMIUM"
  label: string
  className: string
}

export function CheckoutButton({ plan, label, className }: CheckoutButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cpfCnpj, setCpfCnpj] = useState("")
  const [phone, setPhone] = useState("")

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/asaas/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cpfCnpj, mobilePhone: phone }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao processar"); return }

      if (data.paymentLink) {
        window.location.href = data.paymentLink
      } else {
        toast.success("Assinatura criada! Verifique seu email para pagar.")
        setOpen(false)
      }
    } catch {
      toast.error("Erro de rede")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold dash-title">Assinar plano {plan === "PREMIUM" ? "Premium" : "Visibilidade"}</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 dash-muted" />
              </button>
            </div>

            <p className="text-sm dash-subtitle">
              {plan === "PREMIUM" ? "R$ 197/mês" : "R$ 79/mês"} · PIX, cartão ou boleto via Asaas
            </p>

            <form onSubmit={handleCheckout} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold dash-muted uppercase tracking-wide">CPF ou CNPJ</label>
                <input
                  required
                  value={cpfCnpj}
                  onChange={e => setCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold dash-muted uppercase tracking-wide">Celular (opcional)</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(61) 99999-9999"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm dash-title focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Processando...</> : "Continuar para pagamento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
