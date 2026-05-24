import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Domínio canônico — só redireciona quando definido via env (CANONICAL_HOST).
// Enquanto o domínio não existir, deixe a env vazia para o .vercel.app funcionar.
const CANONICAL_HOST = process.env.CANONICAL_HOST?.trim()

// Apenas estas rotas exigem autenticação. Todo o resto é público
// (homepage, listagens, detalhe de negócio, reivindicação, auth).
const PROTECTED_PREFIXES = ["/dashboard"]

export function middleware(request: NextRequest) {
  // Redireciona .vercel.app → domínio canônico SOMENTE se CANONICAL_HOST estiver
  // configurado (ou seja, depois que você comprar e apontar o domínio).
  const host = request.headers.get("host") ?? ""
  if (CANONICAL_HOST && host.includes("vercel.app") && host !== CANONICAL_HOST) {
    const url = request.nextUrl.clone()
    url.protocol = "https:"
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, { status: 301 })
  }

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))

  if (!isProtected) {
    return NextResponse.next()
  }

  // Verifica apenas o cookie de sessão — sem Prisma no middleware (edge).
  // A verificação de role (ADMIN) é feita nas próprias páginas via auth().
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!sessionToken) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
