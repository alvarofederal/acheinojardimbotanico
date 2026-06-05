"use client"

import { useState, useEffect, useCallback } from "react"

export interface FavItem {
  id: string
  name: string
  href: string
  photo: string | null
}

const KEY = "ajb_favoritos"
export const MAX_FAVORITOS = 3
const EVENT = "ajb-favoritos-changed"

function read(): FavItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.slice(0, MAX_FAVORITOS) : []
  } catch {
    return []
  }
}

function write(list: FavItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

/**
 * Favoritos da população — guardados no localStorage do aparelho (sem conta).
 * Reativo: qualquer coração/faixa se atualiza quando outro componente muda a lista.
 */
export function useFavoritos() {
  const [list, setList] = useState<FavItem[]>([])

  useEffect(() => {
    const sync = () => setList(read())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync) // sincroniza entre abas
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const isFav = useCallback((id: string) => list.some(f => f.id === id), [list])

  /** Retorna "added" | "removed" | "limit" (quando já tem 3 e tenta adicionar). */
  const toggle = useCallback((item: FavItem): "added" | "removed" | "limit" => {
    const cur = read()
    if (cur.some(f => f.id === item.id)) {
      write(cur.filter(f => f.id !== item.id))
      return "removed"
    }
    if (cur.length >= MAX_FAVORITOS) return "limit"
    write([...cur, item])
    return "added"
  }, [])

  return { list, isFav, toggle, max: MAX_FAVORITOS }
}
