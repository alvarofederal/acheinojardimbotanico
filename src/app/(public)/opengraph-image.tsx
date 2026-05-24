import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Achei no Jardim Botânico — guia comercial local"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center", padding: "70px",
          background: "linear-gradient(135deg, #1E5C45 0%, #134034 60%, #0F2E26 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", width: "70px", height: "70px", borderRadius: "22px", background: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: "30px" }}>
          <svg width="40" height="40" viewBox="0 0 24 24"><path d="M21 3C9 3 4 10 4 18c0 1 0 2 .3 3 6-9 12-12 16-13-4 3-8 7-11 14 9 0 15-6 15-16 0-1 0-2-.3-3Z" fill="#A3C4B3" /></svg>
        </div>
        <div style={{ display: "flex", fontSize: "72px", color: "#ffffff", fontWeight: 800, lineHeight: 1.1 }}>
          Achei no Jardim Botânico
        </div>
        <div style={{ display: "flex", fontSize: "32px", color: "#D2B48C", marginTop: "20px" }}>
          O melhor do bairro, em um só lugar
        </div>
        <div style={{ display: "flex", fontSize: "24px", color: "rgba(255,255,255,0.5)", marginTop: "40px" }}>
          Restaurantes · Serviços · Saúde · Beleza — Brasília (DF)
        </div>
      </div>
    ),
    { ...size }
  )
}
