"use client"

import { QRCodeSVG } from "qrcode.react"

export interface DisplayCardData {
  name: string
  category: string
  /** URL completa que o QR aponta (ex.: https://.../quotidiano) */
  url: string
  /** Rótulo exibido em texto (ex.: acheinojardimbotanico.com.br/quotidiano) */
  label: string
  /** Foto/logo da loja (avatar circular). Null = mostra a inicial. */
  imageUrl: string | null
}

/**
 * Cartão de display da loja — tamanho A6 (105×148mm), pronto para impressão.
 * Identidade Flora. O QR é gerado de verdade a partir de `url`.
 */
export function DisplayCard({ data }: { data: DisplayCardData }) {
  const slashIdx = data.label.lastIndexOf("/")
  const base = slashIdx > 0 ? data.label.slice(0, slashIdx + 1) : data.label
  const handle = slashIdx > 0 ? data.label.slice(slashIdx + 1) : ""

  return (
    <div
      style={{
        width: "105mm",
        height: "148mm",
        background: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Playfair Display', Georgia, serif",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Faixa de marca */}
      <div style={{ background: "#1E5C45", borderBottom: "0.5mm solid #D2B48C", padding: "5mm 4mm 4mm", textAlign: "center" }}>
        <svg width="8mm" height="10mm" viewBox="0 0 22 26" style={{ display: "block", margin: "0 auto 1.2mm" }}>
          <path d="M11 0 C18 3 20 14 11 22 C2 14 4 3 11 0 Z" fill="#F4F0E8" />
          <line x1="11" y1="4" x2="11" y2="20" stroke="#1E5C45" strokeWidth="0.8" opacity="0.5" />
          <circle cx="11" cy="2.6" r="2" fill="#D2B48C" />
        </svg>
        <div style={{ fontSize: "5mm", fontWeight: 700, color: "#F4F0E8", lineHeight: 1 }}>
          Achei no <span style={{ fontStyle: "italic", color: "#D2B48C" }}>Jardim Botânico</span>
        </div>
        <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: "2mm", fontWeight: 600, letterSpacing: "2.2mm", color: "#A3C4B3", marginTop: "1.2mm", paddingLeft: "2.2mm" }}>
          O GUIA DO BAIRRO
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "5mm 6mm 4mm" }}>
        {/* Avatar + nome + categoria + selo */}
        <div style={{ textAlign: "center", width: "100%" }}>
          <div
            style={{
              width: "20mm", height: "20mm", borderRadius: "50%", overflow: "hidden",
              margin: "0 auto 2mm", border: "0.8mm solid #D2B48C",
              boxShadow: "0 0.5mm 2.5mm rgba(30,92,69,0.25)", background: "#1E5C45",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {data.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt={data.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "10mm", fontWeight: 700, color: "#F4F0E8", lineHeight: 1 }}>
                {data.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize: "7mm", fontWeight: 700, color: "#1E5C45", lineHeight: 1.05, wordBreak: "break-word" }}>
            {data.name}
          </div>
          {data.category && (
            <div style={{ fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.7mm", fontWeight: 600, letterSpacing: "2.4mm", color: "#B8945A", marginTop: "1.2mm", paddingLeft: "2.4mm", textTransform: "uppercase" }}>
              {data.category}
            </div>
          )}
          <div style={{ display: "inline-block", marginTop: "2.5mm", padding: "1.3mm 4mm", borderRadius: "10mm", background: "rgba(30,92,69,0.1)", fontFamily: "'Inter', Arial, sans-serif", fontSize: "2.4mm", fontWeight: 700, letterSpacing: "0.4mm", color: "#1E5C45" }}>
            ✓ FAÇO PARTE DO GUIA DO BAIRRO
          </div>
        </div>

        {/* QR */}
        <div style={{ background: "#fff", borderRadius: "4mm", padding: "4.5mm", boxShadow: "0 1.1mm 4mm rgba(30,92,69,0.22)" }}>
          <QRCodeSVG value={data.url} level="Q" fgColor="#15281e" bgColor="#ffffff" size={256} style={{ width: "34mm", height: "34mm", display: "block" }} />
        </div>

        {/* Chamada + URL + rodapé */}
        <div style={{ textAlign: "center", width: "100%", fontFamily: "'Inter', Arial, sans-serif" }}>
          <div style={{ fontSize: "3.5mm", fontWeight: 700, color: "#1E5C45" }}>
            Aponte a câmera do seu celular
          </div>
          <div style={{ fontSize: "2.8mm", color: "#8C7459", marginTop: "0.5mm" }}>
            e veja fotos, horários e fale no WhatsApp
          </div>
          <div style={{ display: "inline-block", marginTop: "2.5mm", padding: "1.5mm 5mm", border: "0.4mm solid #D2B48C", borderRadius: "10mm", fontSize: "3.1mm", fontWeight: 500, color: "#1E5C45" }}>
            {base}
            {handle && <span style={{ fontWeight: 700, color: "#B8945A" }}>{handle}</span>}
          </div>
          <div style={{ fontSize: "2mm", color: "#A39383", marginTop: "2.5mm", letterSpacing: "0.3mm" }}>
            Jardim Botânico · Jardins Mangueiral · Brasília-DF
          </div>
        </div>
      </div>
    </div>
  )
}
