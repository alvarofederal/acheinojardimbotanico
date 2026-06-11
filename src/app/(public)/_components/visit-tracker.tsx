"use client"

import { useEffect } from "react"

/**
 * Pinga a presença ao carregar e a cada 60s — alimenta as métricas do admin.
 * Batimento + janela de 150s no painel = "online agora" com baixa carga no banco.
 * (Era 12s; reduzido 5x — o upsert de presença era a query mais frequente do
 * sistema e o gatilho estatístico do PANIC do query engine na Hostinger.)
 */
export function VisitTracker() {
  useEffect(() => {
    const ping = () => { fetch("/api/track/visit", { method: "POST", keepalive: true }).catch(() => {}) }
    ping()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") ping()
    }, 60_000)
    const onVisible = () => { if (document.visibilityState === "visible") ping() }
    document.addEventListener("visibilitychange", onVisible)
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible) }
  }, [])
  return null
}
