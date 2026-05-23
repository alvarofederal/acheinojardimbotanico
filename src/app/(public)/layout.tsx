import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  metadataBase: new URL("https://acheinojardimbotanico.com.br"),
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505]">
      {/* Header público */}
      <header className="sticky top-0 z-40 border-b border-gray-100 dark:border-white/[0.06] bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg tracking-tight select-none"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif" }}>
            <span className="text-gray-900 dark:text-white">Achei no</span>
            <span style={{ color: "#10b981" }}> JBT</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/register"
              className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
              Cadastrar negócio
            </Link>
          </div>
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 dark:border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-400 dark:text-white/30">
          <p>© 2026 Achei no Jardim Botânico — Guia comercial hiperlocal do Jardim Botânico (DF)</p>
        </div>
      </footer>
    </div>
  )
}
