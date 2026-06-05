"use client"

import { useRef, useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

export interface CardCardData {
  title: string                 // nome (pessoa ou negócio)
  subtitle?: string | null      // cargo / categoria
  lines: string[]               // contatos/links — full-width embaixo
  url: string                   // destino do QR
  imageUrl: string | null       // foto/logo
}

/**
 * Nome em UMA linha que preenche a largura: mede o texto e encolhe a fonte
 * até caber, sem nunca quebrar a linha.
 */
function FitName({ name, maxMm }: { name: string; maxMm: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState(maxMm)

  useEffect(() => {
    const wrap = wrapRef.current
    const span = spanRef.current
    if (!wrap || !span) return
    const MIN = 2.6
    span.style.fontSize = maxMm + "mm"
    const available = wrap.clientWidth
    const natural = span.scrollWidth
    let s = maxMm
    if (natural > available && available > 0) {
      s = Math.max(MIN, maxMm * (available / natural) * 0.98)
    }
    setSize(s)
  }, [name, maxMm])

  return (
    <div ref={wrapRef} style={{ width: "100%", textAlign: "center", overflow: "hidden" }}>
      <span ref={spanRef} style={{ fontSize: size + "mm", whiteSpace: "nowrap", fontWeight: 700, color: "#1E5C45", lineHeight: 1.1, display: "inline-block" }}>
        {name}
      </span>
    </div>
  )
}

/** Cartão de visita — 90×50mm. Faixa verde no topo, logo, nome dinâmico, QR + contatos. */
export function CardCard({ data }: { data: CardCardData }) {
  return (
    <div
      style={{
        width: "90mm", height: "50mm", background: "#FAF7F2", display: "flex", flexDirection: "column",
        fontFamily: "'Playfair Display', Georgia, serif", overflow: "hidden", boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}
    >
      {/* Faixa verde (logo da marca) */}
      <div style={{ background: "#1E5C45", borderBottom: "0.4mm solid #D2B48C", padding: "2mm 4mm", display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5mm" }}>
        <svg width="3.2mm" height="4mm" viewBox="0 0 22 26">
          <path d="M11 0 C18 3 20 14 11 22 C2 14 4 3 11 0 Z" fill="#F4F0E8" />
          <circle cx="11" cy="2.6" r="2" fill="#D2B48C" />
        </svg>
        <div style={{ fontSize: "3.2mm", fontWeight: 700, color: "#F4F0E8", whiteSpace: "nowrap" }}>
          Achei no <span style={{ fontStyle: "italic", color: "#D2B48C" }}>Jardim Botânico</span>
        </div>
      </div>

      {/* Avatar/logo da loja (se houver) */}
      {data.imageUrl && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5mm" }}>
          <div style={{ width: "9mm", height: "9mm", borderRadius: "50%", overflow: "hidden", border: "0.5mm solid #D2B48C" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.imageUrl} alt={data.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      )}

      {/* Nome — de fora a fora, 1 linha, fonte dinâmica */}
      <div style={{ padding: "1mm 2mm 0" }}>
        <FitName name={data.title} maxMm={data.imageUrl ? 6.5 : 8} />
      </div>
      {data.subtitle && (
        <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.2mm", fontWeight: 600, letterSpacing: "0.5mm", color: "#B8945A", textAlign: "center", textTransform: "uppercase", marginTop: "0.4mm" }}>
          {data.subtitle}
        </div>
      )}

      {/* Contatos (esquerda) + QR (direita) */}
      <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "1mm 4mm 3.5mm", gap: "2mm" }}>
        <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.5mm", color: "#2A2A2A", lineHeight: 1.45, minWidth: 0 }}>
          {data.lines.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</div>
          ))}
        </div>
        <div style={{ background: "#fff", padding: "0.8mm", borderRadius: "1mm", flexShrink: 0 }}>
          <QRCodeSVG value={data.url} level="M" fgColor="#15281e" bgColor="#ffffff" size={128} style={{ width: "14mm", height: "14mm", display: "block" }} />
        </div>
      </div>
    </div>
  )
}
