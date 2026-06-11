import type { Metadata } from "next"
import Link from "next/link"
import { Instagram, Leaf } from "lucide-react"
import { PublicNav } from "./_components/public-nav"
import { VisitTracker } from "./_components/visit-tracker"
import { ThemeToggle } from "@/components/theme-toggle"
import { SiteLogo } from "@/components/ui/site-logo"
import { APP_VERSION } from "@/lib/version"

export const metadata: Metadata = {
  metadataBase: new URL("https://acheinojardimbotanico.com.br"),
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flora-bg flex flex-col">
      <VisitTracker />
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-flora-green/[0.08] dark:border-white/[0.06] bg-flora-cream/80 dark:bg-flora-deep/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <SiteLogo href="/" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <PublicNav />
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      {/* Footer */}
      <footer className="mt-20 border-t border-flora-green/[0.08] dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <SiteLogo href="/" />
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Instagram */}
              <Link
                href="https://www.instagram.com/acheinojardimbotanico"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors group"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-flora-green/10 dark:bg-flora-fresh/10 group-hover:bg-flora-green/20 dark:group-hover:bg-flora-fresh/20 transition-colors">
                  <Instagram className="w-4 h-4 text-flora-green dark:text-flora-fresh" strokeWidth={1.8} />
                </span>
                <span className="font-medium">@acheinojardimbotanico</span>
              </Link>

              {/* Links */}
              <nav className="flex items-center gap-5 text-sm flora-muted">
                <Link href="/termos" className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">Termos</Link>
                <Link href="/privacidade" className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">Privacidade</Link>
                <Link href="/register" className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">Anunciar</Link>
              </nav>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs flora-muted/70 text-center sm:text-left">
              © 2026 Achei no Jardim Botânico · Guia hiperlocal do Jardim Botânico (DF). Algumas informações fornecidas por Google.
            </p>
            {/* Selo verde — fiel ao claim do data center (energia renovável/compensada) */}
            <span
              className="flex items-center gap-1.5 text-xs flora-muted/70 whitespace-nowrap"
              title="Nosso servidor fica em um data center alimentado ou compensado por 100% de energia renovável."
            >
              <Leaf className="w-3.5 h-3.5 text-flora-green dark:text-flora-fresh" strokeWidth={2} />
              Hospedado com 100% de energia renovável
            </span>
            {/* Versão (SemVer) — fonte: package.json. Confere se o deploy subiu. */}
            <span
              className="text-xs tracking-wide flora-muted/60 select-none whitespace-nowrap"
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
