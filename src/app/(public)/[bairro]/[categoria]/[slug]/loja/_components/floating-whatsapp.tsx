"use client"

import { WhatsappIcon } from "@/components/whatsapp-icon"

/** Botão de WhatsApp fixo no canto — sempre visível enquanto rola a loja. */
export function FloatingWhatsApp({
  businessId, whatsapp, storeMessage, businessUrl,
}: {
  businessId: string; whatsapp: string; storeMessage: string | null; businessUrl: string
}) {
  function open() {
    const base = storeMessage?.trim() || "Olá! Vi sua loja no Achei no Jardim Botânico e gostaria de saber mais."
    const text = `${base}\n${businessUrl}`
    fetch("/api/track/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId }) }).catch(() => {})
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <button onClick={open} aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-flora-green hover:bg-flora-fresh text-white font-semibold text-sm shadow-xl shadow-flora-green/30 hover:-translate-y-0.5 transition-all">
      <WhatsappIcon className="w-5 h-5" />
      <span className="hidden sm:inline">Falar no WhatsApp</span>
    </button>
  )
}
