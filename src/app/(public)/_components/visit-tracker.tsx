"use client"

import { useEffect } from "react"

/**
 * Pinga a presença ao carregar e a cada 12s — alimenta as métricas do admin.
 * Batimento curto + janela de 30s no painel = "online agora" quase em tempo real:
 * entra e conta na hora; ao sair, para de pingar e some em ~30s.
 */
export function VisitTracker() {
  useEffect(() => {
    const ping = () => { fetch("/api/track/visit", { method: "POST", keepalive: true }).catch(() => {}) }
    ping()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") ping()
    }, 12_000)
    const onVisible = () => { if (document.visibilityState === "visible") ping() }
    document.addEventListener("visibilitychange", onVisible)
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible) }
  }, [])
  return null
}
