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
    <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-5 w-5 h-5 text-flora-green/60" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="O que você procura no Jardim Botânico?"
          className="w-full h-14 pl-13 pr-32 rounded-full bg-white text-flora-ink placeholder:text-flora-ink/35 shadow-xl shadow-flora-green/10 border border-white/60 focus:outline-none focus:ring-2 focus:ring-flora-fresh/50 text-base"
          style={{ paddingLeft: "3.25rem" }}
        />
        <button
          type="submit"
          className="absolute right-2 h-10 px-5 rounded-full bg-flora-green hover:bg-flora-fresh text-white text-sm font-semibold transition-all hover:shadow-lg"
        >
          Buscar
        </button>
      </div>
    </form>
  )
}
