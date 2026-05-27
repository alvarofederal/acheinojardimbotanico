/**
 * GET /api/photo/{photoName}  (catch-all: places/X/photos/Y)
 * Proxy de fotos do Google Places com AUTO-CURA:
 *  - resolve a URL real do CDN (1 chamada cobrável ao Google) e cacheia
 *  - redireciona o navegador imediatamente (sem travar)
 *  - em segundo plano (after), sobe a foto pro Cloudinary e troca a Photo.url
 *    → da próxima vez a página serve direto do Cloudinary (Google nunca mais é chamado)
 *  Assim cada foto custa Google no MÁXIMO 1x na vida (só as realmente vistas).
 */
export const runtime = "nodejs"

import { NextRequest, NextResponse, after } from "next/server"
import { resolveGooglePhotoUri } from "@/lib/places"
import { uploadToCloudinary, publicIdFromPhotoName } from "@/lib/cloudinary"
import { db } from "@/lib/prisma"

// Cache em memória (por instância) do photoName → URL do CDN
const cache = new Map<string, { uri: string; at: number }>()
const TTL = 1000 * 60 * 60 * 24 // 24h

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string[] }> }
) {
  const { ref } = await params
  const photoName = ref.join("/") // "places/X/photos/Y"

  if (!photoName.startsWith("places/") || !photoName.includes("/photos/")) {
    return NextResponse.json({ error: "Foto inválida" }, { status: 400 })
  }

  const width = Number(req.nextUrl.searchParams.get("w") ?? 1600)
  const cacheKey = `${photoName}@${width}`

  const hit = cache.get(cacheKey)
  const uri = hit && Date.now() - hit.at < TTL ? hit.uri : await resolveGooglePhotoUri(photoName, width)

  if (!uri) return NextResponse.json({ error: "Foto indisponível" }, { status: 502 })
  cache.set(cacheKey, { uri, at: Date.now() })

  // Migra pro Cloudinary em segundo plano (não trava o carregamento da imagem).
  after(async () => {
    try {
      const secureUrl = await uploadToCloudinary(uri, publicIdFromPhotoName(photoName))
      await db.photo.updateMany({ where: { url: `/api/photo/${photoName}` }, data: { url: secureUrl } })
    } catch (e) {
      console.error("Falha ao migrar foto p/ Cloudinary:", e)
    }
  })

  return redirectTo(uri)
}

function redirectTo(uri: string) {
  return NextResponse.redirect(uri, {
    status: 302,
    headers: {
      // browser 1 dia, CDN da Vercel 7 dias → poucas chamadas ao Google
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  })
}
