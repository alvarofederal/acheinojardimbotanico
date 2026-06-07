"use client"

import { useEffect } from "react"
import { Printer } from "lucide-react"
import { CardCard, type CardCardData } from "@/components/card-card"

const COLS = 2
const ROWS = 5
const TOTAL = COLS * ROWS // 10 cartões por folha A4

export function CardPrintView({ data, filename }: { data: CardCardData; filename: string }) {
  useEffect(() => {
    const prev = document.title
    document.title = filename
    let fired = false
    const print = () => { if (!fired) { fired = true; window.print() } }
    // Imprime só depois que o avatar carregar (senão sai sem imagem); fallback de 2.5s.
    const fallback = setTimeout(print, 2500)
    if (data.imageUrl) {
      const img = new Image()
      const go = () => { clearTimeout(fallback); setTimeout(print, 250) }
      img.onload = go
      img.onerror = go
      img.src = data.imageUrl
    } else {
      clearTimeout(fallback)
      setTimeout(print, 500)
    }
    return () => { clearTimeout(fallback); document.title = prev }
  }, [filename, data.imageUrl])

  return (
    <div style={{ background: "#e5e5e5", minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @page { size: A4; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .sheet { box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ textAlign: "center" }}>
        <button onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "9999px", background: "#1E5C45", color: "#fff", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "14px", border: "none", cursor: "pointer" }}>
          <Printer size={16} /> Imprimir / Salvar PDF — folha A4 com {TOTAL} cartões
        </button>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#666", marginTop: "8px", maxWidth: "360px" }}>
          No destino escolha <strong>A4</strong> e <strong>margens: nenhuma</strong>. Para PDF, &quot;Salvar como PDF&quot;. Depois é só imprimir e cortar nas linhas.
        </p>
      </div>

      {/* Folha A4 */}
      <div className="sheet" style={{ width: "210mm", height: "297mm", background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 90mm)`, gridTemplateRows: `repeat(${ROWS}, 50mm)` }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{ outline: "0.2mm dashed #b9a78c", outlineOffset: "-0.1mm" }}>
              <CardCard data={data} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
