"use client"

import { useEffect } from "react"
import { Printer, RotateCcw } from "lucide-react"
import { DisplayCard, type DisplayCardData } from "@/components/display-card"

/**
 * Impressão do display em folha A5, economizando papel: o card A6 (105×148mm)
 * é rotacionado 90° (vira 148×105) e ocupa SÓ a metade de cima da A5 (148×105).
 * A metade de baixo fica em branco — o operador imprime um lojista, vira a folha
 * 180° e reimprime o próximo, que cai na metade de baixo. A5 = 2 × A6, zero sobra.
 */
export function PrintView({ data, filename }: { data: DisplayCardData; filename: string }) {
  useEffect(() => {
    // O navegador usa document.title como nome sugerido no "Salvar como PDF"
    const prev = document.title
    document.title = filename
    // dá tempo das fontes e do QR renderizarem antes de abrir a impressão
    const t = setTimeout(() => window.print(), 700)
    return () => { clearTimeout(t); document.title = prev }
  }, [filename])

  return (
    <div
      className="print-stage"
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
        @page { size: A5; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .print-stage { min-height: 0 !important; background: #fff !important; padding: 0 !important; gap: 0 !important; }
          .a5-sheet { box-shadow: none !important; }
        }
      `}</style>

      {/* Folha A5 (148×210mm) */}
      <div
        className="a5-sheet"
        style={{
          width: "148mm",
          height: "210mm",
          background: "#fff",
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Metade de cima (148×105mm) — display A6 girado 90° preenche exatamente */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "148mm", height: "105mm", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(90deg)" }}>
            <DisplayCard data={data} />
          </div>
        </div>

        {/* Metade de baixo — só na tela: guia do reaproveitamento (não imprime) */}
        <div
          className="no-print"
          style={{
            position: "absolute", top: "105mm", left: 0, width: "148mm", height: "105mm",
            borderTop: "1px dashed #c9b79a",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px",
            fontFamily: "Inter, sans-serif", color: "#9a8a74", textAlign: "center", padding: "0 16mm",
          }}
        >
          <RotateCcw size={22} strokeWidth={1.6} />
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, lineHeight: 1.5 }}>
            Metade reaproveitável
          </p>
          <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.5 }}>
            Imprima este lojista, gire a folha 180° e reimprima o próximo — ele cai aqui.
          </p>
        </div>
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
      <p className="no-print" style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#666", margin: 0, textAlign: "center", maxWidth: "360px", lineHeight: 1.6 }}>
        Na janela de impressão, escolha papel <strong>A5</strong> e margens <strong>&quot;Nenhuma&quot;</strong>. Imprime na metade de cima; para o próximo lojista, <strong>vire a folha 180°</strong> e imprima de novo — cai na metade de baixo.
      </p>
    </div>
  )
}
