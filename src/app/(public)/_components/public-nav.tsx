"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useSession } from "next-auth/react"

const CONTENT_LINKS = [
  { href: "/promocoes", label: "Promoções" },
  { href: "/noticias", label: "Notícias" },
  { href: "/eventos", label: "Eventos" },
]

export function PublicNav() {
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
        {CONTENT_LINKS.map(l => (
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
        <nav className="flex items-center gap-5">
          {CONTENT_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="font-serif text-[15px] flora-ink hover:text-flora-green dark:hover:text-flora-fresh transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={isLoggedIn ? "/dashboard" : "/login"}
            className={`text-sm font-medium transition-colors px-3 py-2 ${isLoggedIn ? "text-flora-green dark:text-flora-fresh hover:text-flora-fresh" : "flora-muted hover:text-flora-green dark:hover:text-flora-fresh"}`}>
            {isLoggedIn ? "Acessar" : "Entrar"}
          </Link>
          <Link href="/anuncie" className="text-sm font-semibold px-4 py-2 rounded-full bg-flora-green hover:bg-flora-fresh text-white transition-all hover:shadow-lg hover:shadow-flora-green/25">Anunciar</Link>
        </div>
      </div>

      {/* Mobile toggle */}
      <button onClick={() => setOpen(true)} className="md:hidden p-2 rounded-lg flora-ink" aria-label="Menu">
        <Menu className="w-6 h-6" />
      </button>

      {mounted && drawer && createPortal(drawer, document.body)}
    </>
  )
}
