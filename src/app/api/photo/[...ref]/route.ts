/**
 * GET /api/photo/{photoName}  (catch-all: places/X/photos/Y)
 * Proxy de fotos do Google Places:
 *  - esconde a chave (a chamada ao Google é server-side)
 *  - busca a URL real do CDN uma vez (skipHttpRedirect) e cacheia
 *  - redireciona o navegador para o CDN do Google (lh3.googleusercontent.com),
 *    que serve a imagem de graça
 *  - cache HTTP (browser + CDN da Vercel) evita rechamar o Google a cada view
 */
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { getGooglePhotoUrl } from "@/lib/places"

// Cache em memória (por instância) do photoName → URL do CDN
const cache = new Map<string, { uri: string; at: number }>()
const TTL = 1000 * 60 * 60 * 24 // 24h

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string[] }> }
) {
  const { ref } = await params
  const photoName = ref.join("/") // "places/X/photos/Y"

  // valida formato esperado
  if (!photoName.startsWith("places/") || !photoName.includes("/photos/")) {
    return NextResponse.json({ error: "Foto inválida" }, { status: 400 })
  }

  const width = Number(req.nextUrl.searchParams.get("w") ?? 1600)
  const cacheKey = `${photoName}@${width}`

  // cache em memória
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < TTL) {
    return redirectTo(hit.uri)
  }

  try {
    // skipHttpRedirect=true → Google devolve JSON { photoUri }
    const res = await fetch(getGooglePhotoUrl(photoName, width, true), {
      // cache do fetch no edge/Node da Vercel
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Foto indisponível" }, { status: res.status })
    }

    const data = (await res.json()) as { photoUri?: string }
    if (!data.photoUri) {
      return NextResponse.json({ error: "Sem URL de foto" }, { status: 502 })
    }

    cache.set(cacheKey, { uri: data.photoUri, at: Date.now() })
    return redirectTo(data.photoUri)
  } catch {
    return NextResponse.json({ error: "Erro ao buscar foto" }, { status: 500 })
  }
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
