"use client"

import { useState } from "react"
import { QrCode, X, Printer } from "lucide-react"
import { DisplayCard, type DisplayCardData } from "@/components/display-card"

export function DisplayButton({ businessId, data }: { businessId: string; data: DisplayCardData }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Gerar display para impressão"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
      >
        <QrCode className="w-3.5 h-3.5" /> Display
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0f1c18] rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-semibold dash-title flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-500" /> Display da loja
                </h3>
                <p className="text-xs dash-muted mt-0.5">{data.name}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                <X className="w-4 h-4 dash-muted" />
              </button>
            </div>

            {/* Preview escalado */}
            <div className="flex justify-center">
              <div style={{ width: "252px", height: "355px", overflow: "hidden", borderRadius: "8px" }}>
                <div style={{ transform: "scale(0.635)", transformOrigin: "top left" }}>
                  <DisplayCard data={data} />
                </div>
              </div>
            </div>

            <a
              href={`/display-print/${businessId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimir / Gerar PDF (A6)
            </a>
          </div>
        </div>
      )}
    </>
  )
}
