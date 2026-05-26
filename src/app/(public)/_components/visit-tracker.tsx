"use client"

import { useEffect } from "react"

/** Pinga a presença ao carregar e a cada 60s — alimenta as métricas do admin. */
export function VisitTracker() {
  useEffect(() => {
    const ping = () => { fetch("/api/track/visit", { method: "POST" }).catch(() => {}) }
    ping()
    const id = setInterval(() => {
      if (document.visibilityState === "visible") ping()
    }, 60_000)
    return () => clearInterval(id)
  }, [])
  return null
}
