"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useFavoritos } from "@/lib/use-favoritos"

/** Faixa "Seus favoritos" — horizontal, na home. Some quando não há favoritos. */
export function FavoritosStrip() {
  const { list } = useFavoritos()
  if (list.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-2">
      <div className="flex items-center gap-2 mb-5">
        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink">Seus favoritos</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {list.map(f => (
          <Link key={f.id} href={f.href}
            className="flora-card group rounded-2xl overflow-hidden flex-shrink-0 w-44 sm:w-52">
            <div className="relative aspect-[16/10] overflow-hidden bg-flora-sand dark:bg-white/5">
              {f.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.photo} alt={f.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-flora-green/15 to-flora-fresh/10">
                  <span className="font-serif text-3xl text-flora-green/40">{f.name[0]}</span>
                </div>
              )}
              <span className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-md shadow-sm">
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              </span>
            </div>
            <div className="p-3">
              <h3 className="font-serif text-sm font-semibold flora-ink leading-tight line-clamp-1 group-hover:text-flora-green dark:group-hover:text-flora-fresh transition-colors">{f.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
