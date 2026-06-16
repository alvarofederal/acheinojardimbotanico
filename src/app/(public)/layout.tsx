import type { Metadata } from "next"
import Link from "next/link"
import { Instagram, Leaf } from "lucide-react"
import { PublicHeader } from "./_components/public-header"
import { VisitTracker } from "./_components/visit-tracker"
import { SiteLogo } from "@/components/ui/site-logo"
import { APP_VERSION } from "@/lib/version"
import { getMenuVisibility } from "@/lib/site-visibility"

export const metadata: Metadata = {
  metadataBase: new URL("https://acheinojardimbotanico.com.br"),
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const visibility = await getMenuVisibility()
  return (
    <div className="min-h-screen flora-bg flex flex-col">
      <VisitTracker />
      {/* Header — transparente sobre o herói na home, congela em verde ao rolar (estudo UAU) */}
      <PublicHeader visibility={visibility} />

      <div className="flex-1">{children}</div>

      {/* Footer — verde profundo com acentos dourados (estilo estudo UAU) */}
      <footer className="mt-20 bg-flora-deep text-flora-cream border-t border-flora-gold/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-7 border-b border-white/10">
            <SiteLogo href="/" tone="light" />
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Instagram */}
              <Link
                href="https://www.instagram.com/acheinojardimbotanico"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-flora-cream/80 hover:text-white transition-colors group"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 ring-1 ring-white/10 group-hover:bg-white/15 transition-colors">
                  <Instagram className="w-4 h-4 text-flora-gold" strokeWidth={1.8} />
                </span>
                <span className="font-medium">@acheinojardimbotanico</span>
              </Link>

              {/* Links */}
              <nav className="flex items-center gap-5 text-sm text-flora-cream/75">
                {visibility.vagas && <Link href="/vagas" className="hover:text-flora-gold transition-colors">Vagas</Link>}
                <Link href="/termos" className="hover:text-flora-gold transition-colors">Termos</Link>
                <Link href="/privacidade" className="hover:text-flora-gold transition-colors">Privacidade</Link>
                <Link href="/register" className="hover:text-flora-gold transition-colors">Anunciar</Link>
              </nav>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-flora-cream/50 text-center sm:text-left">
              © 2026 Achei no Jardim Botânico · Guia hiperlocal do Jardim Botânico (DF). Algumas informações fornecidas por Google.
            </p>
            {/* Selo verde — fiel ao claim do data center (energia renovável/compensada) */}
            <span
              className="flex items-center gap-1.5 text-xs text-flora-cream/55 whitespace-nowrap"
              title="Nosso servidor fica em um data center alimentado ou compensado por 100% de energia renovável."
            >
              <Leaf className="w-3.5 h-3.5 text-flora-fresh" strokeWidth={2} />
              Hospedado com 100% de energia renovável
            </span>
            {/* Versão (SemVer) — fonte: package.json. Confere se o deploy subiu. */}
            <span
              className="text-xs tracking-wide text-flora-cream/45 select-none whitespace-nowrap"
              style={{ fontFamily: "var(--font-roboto)", fontWeight: 500 }}
              title="Versão da aplicação — veja o CHANGELOG.md"
            >
              v{APP_VERSION}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
