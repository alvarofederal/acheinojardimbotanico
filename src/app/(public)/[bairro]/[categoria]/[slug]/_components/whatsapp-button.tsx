"use client"

import { MessageCircle } from "lucide-react"

export function WhatsAppButton({ businessId, whatsapp, name }: { businessId: string; whatsapp: string; name: string }) {
  function handleClick() {
    fetch("/api/track/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId }),
    }).catch(() => {})
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=Olá, vi vocês no Achei no JBT!`, "_blank")
  }

  return (
    <button onClick={handleClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/20">
      <MessageCircle className="w-4 h-4" />
      Abrir no WhatsApp
    </button>
  )
}
