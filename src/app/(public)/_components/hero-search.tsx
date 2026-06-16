"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export function HeroSearch() {
  const router = useRouter()
  const [q, setQ] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (term) router.push(`/busca?q=${encodeURIComponent(term)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl pl-5 pr-2 py-2 shadow-xl shadow-flora-deep/25 transition-all focus-within:border-flora-gold focus-within:ring-4 focus-within:ring-flora-gold/20">
        <Search className="w-5 h-5 text-flora-gold flex-shrink-0" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="O que você procura no Jardim Botânico?"
          aria-label="Buscar no Jardim Botânico"
          className="flex-1 min-w-0 h-10 bg-transparent text-white placeholder:text-white/55 focus:outline-none text-base"
        />
        <button
          type="submit"
          className="flex-shrink-0 h-10 px-5 rounded-full bg-flora-gold hover:brightness-105 text-flora-deep text-sm font-semibold transition-all hover:scale-105"
        >
          Buscar
        </button>
      </div>
    </form>
  )
}
