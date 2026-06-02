"use client"

import { useEffect } from "react"
import { Printer } from "lucide-react"
import { DisplayCard, type DisplayCardData } from "@/components/display-card"

export function PrintView({ data }: { data: DisplayCardData }) {
  useEffect(() => {
    // dá tempo das fontes e do QR renderizarem antes de abrir a impressão
    const t = setTimeout(() => window.print(), 700)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        background: "#e5e5e5",
        padding: "24px",
      }}
    >
      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @page { size: A6; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .print-stage { min-height: 0 !important; background: #fff !important; padding: 0 !important; }
        }
      `}</style>

      <div style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}>
        <DisplayCard data={data} />
      </div>

      <button
        onClick={() => window.print()}
        className="no-print"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          borderRadius: "9999px",
          background: "#1E5C45",
          color: "#fff",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: "14px",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Printer size={16} /> Imprimir / Salvar como PDF
      </button>
      <p className="no-print" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#666", margin: 0, textAlign: "center", maxWidth: "320px" }}>
        Na janela de impressão, escolha <strong>A6</strong> e, para PDF, selecione <strong>&quot;Salvar como PDF&quot;</strong> no destino.
      </p>
    </div>
  )
}
