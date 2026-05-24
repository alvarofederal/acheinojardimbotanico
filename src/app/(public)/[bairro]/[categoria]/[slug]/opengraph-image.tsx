import { ImageResponse } from "next/og"
import { db } from "@/lib/prisma"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Achei no Jardim Botânico"

interface Props {
  params: Promise<{ bairro: string; categoria: string; slug: string }>
}

export default async function Image({ params }: Props) {
  const { slug } = await params
  const business = await db.business.findUnique({
    where: { slug },
    select: { name: true, neighborhood: true, googleRating: true, category: { select: { name: true } } },
  })

  const name = business?.name ?? "Achei no Jardim Botânico"
  const category = business?.category.name ?? "Guia local"
  const neighborhood = business?.neighborhood ?? "Jardim Botânico"
  const rating = business?.googleRating

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "70px",
          background: "linear-gradient(135deg, #1E5C45 0%, #134034 60%, #0F2E26 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* topo: marca */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", width: "44px", height: "44px", borderRadius: "14px", background: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
            {/* folha */}
            <svg width="26" height="26" viewBox="0 0 24 24"><path d="M21 3C9 3 4 10 4 18c0 1 0 2 .3 3 6-9 12-12 16-13-4 3-8 7-11 14 9 0 15-6 15-16 0-1 0-2-.3-3Z" fill="#A3C4B3" /></svg>
          </div>
          <div style={{ display: "flex", fontSize: "26px", color: "rgba(255,255,255,0.85)", fontWeight: 600, letterSpacing: "0.5px" }}>
            Achei no Jardim Botânico
          </div>
        </div>

        {/* centro: nome do negócio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", fontSize: "30px", color: "#D2B48C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "3px" }}>
            {category}
          </div>
          <div style={{ display: "flex", fontSize: "76px", color: "#ffffff", fontWeight: 800, lineHeight: 1.05, maxWidth: "1000px" }}>
            {name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "8px" }}>
            <div style={{ display: "flex", fontSize: "30px", color: "rgba(255,255,255,0.7)" }}>📍 {neighborhood} · Brasília (DF)</div>
            {rating ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "30px", color: "#D2B48C", fontWeight: 700 }}>
                ★ {rating.toFixed(1)}
              </div>
            ) : null}
          </div>
        </div>

        {/* rodapé */}
        <div style={{ display: "flex", fontSize: "24px", color: "rgba(255,255,255,0.45)" }}>
          acheinojardimbotanico.com.br
        </div>
      </div>
    ),
    { ...size }
  )
}
