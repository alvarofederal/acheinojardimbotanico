"use client"

import { QRCodeSVG } from "qrcode.react"

export interface CardCardData {
  title: string                 // nome (pessoa ou negócio)
  subtitle?: string | null      // cargo / categoria
  lines: string[]               // contatos/links — full-width embaixo (não quebram)
  url: string                   // destino do QR
  imageUrl: string | null       // foto/logo; null → sem avatar
}

/**
 * Cartão de visita — 90×50mm (padrão BR), identidade Flora, no molde do display:
 * faixa verde no topo (marca em 1 linha), corpo com nome + QR e contatos embaixo.
 */
export function CardCard({ data }: { data: CardCardData }) {
  return (
    <div
      style={{
        width: "90mm", height: "50mm", background: "#FAF7F2", display: "flex", flexDirection: "column",
        fontFamily: "'Playfair Display', Georgia, serif", overflow: "hidden", boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}
    >
      {/* Faixa verde (navbar) — marca em UMA linha */}
      <div style={{ background: "#1E5C45", borderBottom: "0.4mm solid #D2B48C", padding: "2.2mm 4mm", display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5mm" }}>
        <svg width="3.2mm" height="4mm" viewBox="0 0 22 26">
          <path d="M11 0 C18 3 20 14 11 22 C2 14 4 3 11 0 Z" fill="#F4F0E8" />
          <circle cx="11" cy="2.6" r="2" fill="#D2B48C" />
        </svg>
        <div style={{ fontSize: "3.4mm", fontWeight: 700, color: "#F4F0E8", whiteSpace: "nowrap" }}>
          Achei no <span style={{ fontStyle: "italic", color: "#D2B48C" }}>Jardim Botânico</span>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "3mm 4mm" }}>
        {/* Nome (+ avatar) à esquerda · QR à direita */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2mm" }}>
          <div style={{ minWidth: 0, display: "flex", gap: "2mm", alignItems: "center" }}>
            {data.imageUrl && (
              <div style={{ width: "11mm", height: "11mm", borderRadius: "50%", overflow: "hidden", border: "0.5mm solid #D2B48C", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.imageUrl} alt={data.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "4.6mm", fontWeight: 700, color: "#1E5C45", lineHeight: 1.05, wordBreak: "break-word" }}>{data.title}</div>
              {data.subtitle && (
                <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.3mm", fontWeight: 600, letterSpacing: "0.5mm", color: "#B8945A", marginTop: "0.5mm", textTransform: "uppercase" }}>{data.subtitle}</div>
              )}
            </div>
          </div>
          <div style={{ background: "#fff", padding: "0.8mm", borderRadius: "1mm", flexShrink: 0 }}>
            <QRCodeSVG value={data.url} level="M" fgColor="#15281e" bgColor="#ffffff" size={120} style={{ width: "15mm", height: "15mm", display: "block" }} />
          </div>
        </div>

        {/* Contatos — largura toda, em 1 linha cada (email não estoura) */}
        <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.5mm", color: "#2A2A2A", lineHeight: 1.45 }}>
          {data.lines.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
