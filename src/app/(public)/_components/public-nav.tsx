"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useSession } from "next-auth/react"

type MenuVisibility = { promocoes: boolean; noticias: boolean; eventos: boolean; vagas: boolean }

const CONTENT_LINKS: { href: string; label: string; key: keyof MenuVisibility }[] = [
  { href: "/promocoes", label: "Promoções", key: "promocoes" },
  { href: "/noticias", label: "Notícias", key: "noticias" },
  { href: "/eventos", label: "Eventos", key: "eventos" },
  { href: "/vagas", label: "Vagas", key: "vagas" },
]

export function PublicNav({ visibility }: { visibility: MenuVisibility }) {
  const links = CONTENT_LINKS.filter(l => visibility[l.key])
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  useEffect(() => setMounted(true), [])

  // Trava o scroll do fundo enquanto o menu está aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Drawer renderizado via portal no body — escapa do header (que tem
  // backdrop-filter e quebraria o position:fixed do overlay).
  const drawer = open && (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[82%] flora-bg p-6 flex flex-col gap-1 shadow-2xl overflow-y-auto">
        <button onClick={() => setOpen(false)} className="self-end p-2 rounded-lg flora-ink mb-2" aria-label="Fechar"><X className="w-5 h-5" /></button>
        {links.map(l => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
            className="font-serif text-lg flora-ink py-3 border-b border-flora-green/[0.08] dark:border-white/[0.06]">
            {l.label}
          </Link>
        ))}
        <Link href={isLoggedIn ? "/dashboard" : "/login"} onClick={() => setOpen(false)}
          className={`font-medium py-3 ${isLoggedIn ? "text-flora-green dark:text-flora-fresh" : "flora-ink"}`}>
          {isLoggedIn ? "Acessar painel" : "Entrar"}
        </Link>
        <Link href="/anuncie" onClick={() => setOpen(false)} className="mt-3 text-center font-semibold px-4 py-3 rounded-full bg-flora-green text-white">Anunciar</Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="relative font-serif text-[15px] text-flora-cream/85 hover:text-white transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-flora-gold after:transition-[width] after:duration-300 hover:after:w-full">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href={isLoggedIn ? "/dashboard" : "/login"}
            className={`text-sm font-medium transition-colors px-2 py-2 ${isLoggedIn ? "text-flora-gold hover:brightness-110" : "text-flora-cream/75 hover:text-white"}`}>
            {isLoggedIn ? "Acessar" : "Entrar"}
          </Link>
          <Link href="/anuncie" className="text-sm font-semibold px-5 py-2 rounded-full bg-flora-gold hover:brightness-105 text-flora-deep transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-flora-gold/30">Anunciar</Link>
        </div>
      </div>

      {/* Mobile toggle */}
      <button onClick={() => setOpen(true)} className="md:hidden p-2 rounded-lg text-flora-cream" aria-label="Menu">
        <Menu className="w-6 h-6" />
      </button>

      {mounted && drawer && createPortal(drawer, document.body)}
    </>
  )
}
