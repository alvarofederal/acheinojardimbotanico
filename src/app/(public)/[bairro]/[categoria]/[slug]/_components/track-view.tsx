"use client"

import { useEffect } from "react"

export function TrackView({ businessId }: { businessId: string }) {
  useEffect(() => {
    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    }).catch(() => {})
  }, [businessId])

  return null
}
