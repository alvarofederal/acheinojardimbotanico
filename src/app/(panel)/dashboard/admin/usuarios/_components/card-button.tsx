"use client"

import { useState } from "react"
import { CreditCard, X, Printer } from "lucide-react"
import { CardCard, type CardCardData } from "@/components/card-card"

export function CardButton({ businessId, data }: { businessId: string; data: CardCardData }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Gerar cartão de visita"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
      >
        <CreditCard className="w-3.5 h-3.5" /> Cartão
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#0f1c18] rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-semibold dash-title flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" /> Cartão de visita
                </h3>
                <p className="text-xs dash-muted mt-0.5">{data.title}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><X className="w-4 h-4 dash-muted" /></button>
            </div>

            <div className="flex justify-center">
              <div style={{ width: "306px", height: "170px", overflow: "hidden", borderRadius: "8px" }}>
                <div style={{ transform: "scale(0.9)", transformOrigin: "top left" }}>
                  <CardCard data={data} />
                </div>
              </div>
            </div>

            <a href={`/card-print/${businessId}`} target="_blank" rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
              <Printer className="w-4 h-4" /> Imprimir / Gerar PDF (9×5 cm)
            </a>
          </div>
        </div>
      )}
    </>
  )
}
