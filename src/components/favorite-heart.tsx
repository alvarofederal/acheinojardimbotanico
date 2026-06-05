"use client"

import { Heart } from "lucide-react"
import { toast } from "sonner"
import { useFavoritos, type FavItem } from "@/lib/use-favoritos"

/**
 * Coração de favorito — overlay no canto superior esquerdo da foto.
 * Clique isolado (não abre o negócio). Contorno → vermelho. Limite de 3.
 */
export function FavoriteHeart({ item }: { item: FavItem }) {
  const { isFav, toggle, max } = useFavoritos()
  const fav = isFav(item.id)

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const r = toggle(item)
    if (r === "limit") toast.error(`Você atingiu o limite de ${max} favoritos.`)
    else if (r === "added") toast.success("Adicionado aos favoritos ❤️")
  }

  return (
    <button
      onClick={onClick}
      aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={fav ? "Remover dos favoritos" : "Favoritar"}
      className="absolute top-2.5 left-2.5 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 dark:bg-black/40 backdrop-blur-md shadow-sm hover:scale-110 active:scale-95 transition-transform"
    >
      <Heart className={`w-[18px] h-[18px] transition-colors ${fav ? "fill-red-500 text-red-500" : "text-flora-green/70 dark:text-white/70"}`} />
    </button>
  )
}
