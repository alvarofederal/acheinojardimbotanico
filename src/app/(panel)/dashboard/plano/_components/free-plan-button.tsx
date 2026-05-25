"use client"

import { useState } from "react"
import { X, Info } from "lucide-react"

export function FreePlanButton({ currentPlan, expiresLabel }: { currentPlan: string; expiresLabel: string | null }) {
  const [open, setOpen] = useState(false)

  if (currentPlan === "FREE") {
    return (
      <span className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/10 dash-muted">
        Seu plano atual
      </span>
    )
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
        Voltar ao Free
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/10 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold dash-title">Voltar para o Free</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
            </div>
            <p className="text-sm dash-subtitle leading-relaxed">
              Seu plano <strong className="dash-title">{currentPlan}</strong>
              {expiresLabel ? <> continua ativo até <strong className="dash-title">{expiresLabel}</strong>.</> : <> continua ativo até o fim do período pago.</>}
            </p>
            <p className="text-sm dash-subtitle leading-relaxed">
              Como o pagamento é avulso (sem renovação automática), você não precisa fazer nada:
              ao vencer, sua conta volta automaticamente para o <strong className="dash-title">Free</strong>.
              Você aproveita tudo que já pagou até lá. 🌿
            </p>
            <button onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  )
}
