import type { Metadata } from "next"
import Link from "next/link"
import { PublicNav } from "./_components/public-nav"
import { VisitTracker } from "./_components/visit-tracker"
import { ThemeToggle } from "@/components/theme-toggle"
import { SiteLogo } from "@/components/ui/site-logo"

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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <SiteLogo href="/" />
            <nav className="flex items-center gap-5 text-sm flora-muted">
              <Link href="/termos" className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">Termos</Link>
              <Link href="/privacidade" className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">Privacidade</Link>
              <Link href="/register" className="hover:text-flora-green dark:hover:text-flora-fresh transition-colors">Anunciar</Link>
            </nav>
          </div>
          <p className="mt-6 text-xs flora-muted/70 text-center sm:text-left">
            © 2026 Achei no Jardim Botânico · Guia hiperlocal do Jardim Botânico (DF). Algumas informações fornecidas por Google.
          </p>
        </div>
      </footer>
    </div>
  )
}
