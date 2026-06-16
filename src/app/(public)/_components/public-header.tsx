"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { PublicNav } from "./public-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { SiteLogo } from "@/components/ui/site-logo"

type MenuVisibility = { promocoes: boolean; noticias: boolean; eventos: boolean; vagas: boolean }

/**
 * Cabeçalho público — igual ao estudo UAU:
 * - Na HOME, no topo: TRANSPARENTE (o verde do herói cobre a tela inteira, sem barra).
 * - Ao rolar (ou em qualquer outra página): congela numa barra verde fosca com acento dourado.
 * Logo e links são sempre claros (legíveis sobre o herói verde ou sobre a barra escura).
 */
export function PublicHeader({ visibility }: { visibility: MenuVisibility }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const transparent = pathname === "/" && !scrolled

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        transparent
          ? "bg-transparent"
          : "bg-flora-deep/85 backdrop-blur-xl border-b border-flora-gold/15 shadow-lg shadow-flora-deep/20"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <SiteLogo href="/" tone="light" />
        <div className="flex items-center gap-1">
          <ThemeToggle className="p-2 rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors" />
          <PublicNav visibility={visibility} />
        </div>
      </div>
    </header>
  )
}
