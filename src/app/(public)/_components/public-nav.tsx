"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const CONTENT_LINKS = [
  { href: "/promocoes", label: "Promoções" },
  { href: "/noticias", label: "Notícias" },
  { href: "/eventos", label: "Eventos" },
]

export function PublicNav() {
  const [open, setOpen] = useState(false)

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
          <Link href="/login" className="text-sm font-medium flora-muted hover:text-flora-green dark:hover:text-flora-fresh transition-colors px-3 py-2">Entrar</Link>
          <Link href="/anuncie" className="text-sm font-semibold px-4 py-2 rounded-full bg-flora-green hover:bg-flora-fresh text-white transition-all hover:shadow-lg hover:shadow-flora-green/25">Anunciar</Link>
        </div>
      </div>

      {/* Mobile toggle */}
      <button onClick={() => setOpen(true)} className="md:hidden p-2 rounded-lg flora-ink" aria-label="Menu">
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[80%] flora-bg p-6 flex flex-col gap-1 shadow-2xl">
            <button onClick={() => setOpen(false)} className="self-end p-2 rounded-lg flora-ink mb-2" aria-label="Fechar"><X className="w-5 h-5" /></button>
            {CONTENT_LINKS.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="font-serif text-lg flora-ink py-3 border-b border-flora-green/[0.08] dark:border-white/[0.06]">
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="font-medium flora-ink py-3">Entrar</Link>
            <Link href="/anuncie" onClick={() => setOpen(false)} className="mt-3 text-center font-semibold px-4 py-3 rounded-full bg-flora-green text-white">Anunciar</Link>
          </div>
        </div>
      )}
    </>
  )
}
