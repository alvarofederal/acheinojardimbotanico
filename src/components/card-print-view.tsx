"use client"

import { useEffect, type CSSProperties } from "react"
import { Printer } from "lucide-react"
import { CardCard, type CardCardData } from "@/components/card-card"

// Layout da folha A4 (mm)
const CARD_W = 90
const CARD_H = 50
const COLS = 2
const ROWS = 5
const TOTAL = COLS * ROWS // 10 cartões por folha A4
const GUTTER = 6 // espaço entre cartões (mm) — separa cada cartão e dá lugar pras marcas
const PAGE_W = 210
const PAGE_H = 297
const GRID_W = COLS * CARD_W + (COLS - 1) * GUTTER // 186
const GRID_H = ROWS * CARD_H + (ROWS - 1) * GUTTER // 274
const MX = (PAGE_W - GRID_W) / 2 // 12
const MY = (PAGE_H - GRID_H) / 2 // 11.5

// Gabarito de corte (por cartão)
const MARK = 4 // comprimento do tique (mm)
const OFFSET = 1 // folga entre o tique e o cartão (mm)
const HAIR = 0.4 // espessura da linha (mm) — grossa o bastante pra aparecer

type Mark = { left: string; top: string; width: string; height: string }

/** Marcas de corte nos 4 cantos de um cartão (tiques apontando pra fora). */
function cornerMarks(x0: number, y0: number): Mark[] {
  const x1 = x0 + CARD_W
  const y1 = y0 + CARD_H
  const H = (left: number, top: number): Mark => ({ left: `${left}mm`, top: `${top - HAIR / 2}mm`, width: `${MARK}mm`, height: `${HAIR}mm` })
  const V = (left: number, top: number): Mark => ({ left: `${left - HAIR / 2}mm`, top: `${top}mm`, width: `${HAIR}mm`, height: `${MARK}mm` })
  return [
    H(x0 - OFFSET - MARK, y0), V(x0, y0 - OFFSET - MARK), // sup-esq
    H(x1 + OFFSET, y0), V(x1, y0 - OFFSET - MARK),         // sup-dir
    H(x0 - OFFSET - MARK, y1), V(x0, y1 + OFFSET),         // inf-esq
    H(x1 + OFFSET, y1), V(x1, y1 + OFFSET),                // inf-dir
  ]
}

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

  // Posições dos cartões (grade com gutter) + marcas de corte de cada um.
  const cards: { x: number; y: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cards.push({ x: MX + c * (CARD_W + GUTTER), y: MY + r * (CARD_H + GUTTER) })
    }
  }
  const marks = cards.flatMap(c => cornerMarks(c.x, c.y))

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
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#666", marginTop: "8px", maxWidth: "400px" }}>
          No destino escolha <strong>A4</strong> e <strong>margens: nenhuma</strong>. Para PDF, &quot;Salvar como PDF&quot;.
          Cada cartão tem <strong>marcas de corte nos 4 cantos</strong> — corte seguindo as marcas (a tira entre os cartões é descartada).
        </p>
      </div>

      {/* Folha A4 */}
      <div className="sheet" style={{ position: "relative", width: `${PAGE_W}mm`, height: `${PAGE_H}mm`, background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}>
        {/* Cartões individuais (com espaço entre eles) */}
        {cards.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: `${c.x}mm`, top: `${c.y}mm`, width: `${CARD_W}mm`, height: `${CARD_H}mm`, outline: "0.12mm dashed #ddd2bf", outlineOffset: "-0.06mm" }}>
            <CardCard data={data} />
          </div>
        ))}

        {/* Gabarito — marcas de corte nos cantos de cada cartão */}
        {marks.map((s, i) => (
          <div key={`m${i}`} style={{ position: "absolute", background: "#111", ...s }} />
        ))}
      </div>
    </div>
  )
}
