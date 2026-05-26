export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"

/**
 * Proxy de autocomplete de endereço usando Photon (OpenStreetMap) — gratuito,
 * sem chave de API. Mantém a chamada server-side (não precisa liberar CSP no
 * client) e enviesa os resultados para a região do Jardim Botânico (DF).
 */
const JB_LAT = -15.8794145
const JB_LNG = -47.8105738

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string; street?: string; housenumber?: string; district?: string
    city?: string; state?: string; postcode?: string; countrycode?: string
  }
}

export async function GET(req: NextRequest) {
  // Apenas usuários logados (uso interno do formulário de cadastro)
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  // Limita o uso do proxy externo (Photon) por usuário
  const { allowed } = await checkRateLimit(`geocode:${session.user.id}`, 60, 60 * 1000)
  if (!allowed) return NextResponse.json({ suggestions: [] }, { status: 429 })

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (q.length < 3) return NextResponse.json({ suggestions: [] })

  // Obs.: o Photon público não suporta lang=pt (só default/de/en/fr) — usamos o default.
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lat=${JB_LAT}&lon=${JB_LNG}`

  try {
    const res = await fetch(url, { headers: { "User-Agent": "AcheiNoJardimBotanico/1.0" }, signal: AbortSignal.timeout(6000) })
    if (!res.ok) return NextResponse.json({ suggestions: [] })
    const data = (await res.json()) as { features?: PhotonFeature[] }

    const suggestions = (data.features ?? [])
      .filter(f => !f.properties.countrycode || f.properties.countrycode.toUpperCase() === "BR")
      .map(f => {
        const p = f.properties
        const [lng, lat] = f.geometry.coordinates
        const street = [p.street ?? p.name, p.housenumber].filter(Boolean).join(", ")
        const neighborhood = p.district || ""
        const city = p.city || "Brasília"
        const label = [street || p.name, neighborhood, city].filter(Boolean).join(" · ")
        const address = [street || p.name, neighborhood, city, p.state].filter(Boolean).join(", ")
        return { label, address, lat, lng, neighborhood, city, state: p.state || "DF" }
      })
      .filter(s => s.address)

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
