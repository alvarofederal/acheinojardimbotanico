"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useFavoritos } from "@/lib/use-favoritos"

/** Faixa "Seus favoritos" — na home, mesma linguagem das joias. Some quando não há favoritos. */
export function FavoritosStrip() {
  const { list } = useFavoritos()
  if (list.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-4">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-flora-fresh">
          <Heart className="w-3.5 h-3.5" /> Sua seleção
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold flora-ink mt-2">
          Seus <span className="italic text-flora-gold">favoritos</span>
        </h2>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
        {list.map(f => (
          <Link key={f.id} href={f.href}
            className="group relative rounded-3xl overflow-hidden flex-shrink-0 w-44 sm:w-52 aspect-[3/4] shadow-lg shadow-flora-deep/15 snap-start transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-flora-deep/25">
            {f.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.photo} alt={f.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-110" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-flora-green to-flora-deep flex items-center justify-center">
                <span className="font-serif text-4xl text-white/70">{f.name[0]}</span>
              </div>
            )}
            {/* Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-flora-deep/92 via-flora-deep/25 to-transparent" />
            {/* Anel dourado no hover */}
            <div className="absolute inset-0 rounded-3xl border-[1.5px] border-transparent group-hover:border-flora-gold/70 transition-colors duration-500" />
            {/* Coração (favoritado) */}
            <span className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-md ring-1 ring-white/20">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            </span>
            {/* Nome */}
            <h3 className="absolute inset-x-0 bottom-0 p-4 font-serif text-base font-semibold text-white leading-tight line-clamp-2" style={{ textShadow: "0 2px 12px rgba(0,0,0,.5)" }}>
              {f.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  )
}
