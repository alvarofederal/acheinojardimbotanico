"use client"

import { QRCodeSVG } from "qrcode.react"

export interface CardCardData {
  title: string                 // nome (pessoa ou negócio)
  subtitle?: string | null      // marca / categoria
  lines?: string[]              // linhas de contato (WhatsApp, email) — opcional
  url: string                   // destino do QR
  label: string                 // texto do link exibido
  imageUrl: string | null       // foto/logo; null → folha do Achei
}

/**
 * Cartão de visita — 90×50mm (padrão BR), pronto para impressão. Identidade Flora.
 * Serve tanto pro cartão do Achei (com contato do Álvaro) quanto pro do lojista.
 */
export function CardCard({ data }: { data: CardCardData }) {
  return (
    <div
      style={{
        width: "90mm", height: "50mm", display: "flex", background: "#FAF7F2",
        fontFamily: "'Playfair Display', Georgia, serif", overflow: "hidden",
        boxSizing: "border-box", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
      }}
    >
      {/* Painel esquerdo (marca) */}
      <div style={{ width: "30mm", background: "#1E5C45", borderRight: "0.5mm solid #D2B48C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3mm", gap: "2mm", flexShrink: 0 }}>
        <div style={{ width: "16mm", height: "16mm", borderRadius: "50%", overflow: "hidden", border: "0.6mm solid #D2B48C", background: data.imageUrl ? "transparent" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.imageUrl} alt={data.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg width="9mm" height="11mm" viewBox="0 0 22 26">
              <path d="M11 0 C18 3 20 14 11 22 C2 14 4 3 11 0 Z" fill="#F4F0E8" />
              <line x1="11" y1="4" x2="11" y2="20" stroke="#1E5C45" strokeWidth="0.8" opacity="0.5" />
              <circle cx="11" cy="2.6" r="2" fill="#D2B48C" />
            </svg>
          )}
        </div>
        <div style={{ fontSize: "3mm", fontWeight: 700, color: "#F4F0E8", lineHeight: 1.08, textAlign: "center" }}>
          Achei no <span style={{ fontStyle: "italic", color: "#D2B48C" }}>Jardim Botânico</span>
        </div>
      </div>

      {/* Lado direito (dados) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4mm 4mm 3.5mm", minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "5.5mm", fontWeight: 700, color: "#1E5C45", lineHeight: 1.05, wordBreak: "break-word" }}>{data.title}</div>
          {data.subtitle && (
            <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.5mm", fontWeight: 600, letterSpacing: "0.8mm", color: "#B8945A", marginTop: "0.8mm", textTransform: "uppercase" }}>{data.subtitle}</div>
          )}
          {data.lines && data.lines.length > 0 && (
            <div style={{ marginTop: "2mm", fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.9mm", color: "#2A2A2A", lineHeight: 1.5 }}>
              {data.lines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2mm" }}>
          <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.4mm", color: "#1E5C45", fontWeight: 500, wordBreak: "break-all", lineHeight: 1.2 }}>{data.label}</div>
          <div style={{ background: "#fff", padding: "1mm", borderRadius: "1.5mm", flexShrink: 0 }}>
            <QRCodeSVG value={data.url} level="M" fgColor="#15281e" bgColor="#ffffff" size={128} style={{ width: "15mm", height: "15mm", display: "block" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
