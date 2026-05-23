import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const CANONICAL_HOST = "acheinojardimbotanico.com.br"

// Apenas estas rotas exigem autenticação. Todo o resto é público
// (homepage, listagens, detalhe de negócio, reivindicação, auth).
const PROTECTED_PREFIXES = ["/dashboard"]

export function middleware(request: NextRequest) {
  // Redireciona domínio Vercel → domínio canônico em produção
  const host = request.headers.get("host") ?? ""
  if (host.includes("vercel.app") && process.env.NODE_ENV === "production") {
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
