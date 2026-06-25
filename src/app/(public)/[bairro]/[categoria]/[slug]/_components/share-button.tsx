"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"

/**
 * Botão "Compartilhar" do perfil: usa o Web Share nativo (celular abre WhatsApp,
 * Instagram, etc.); no desktop (sem Web Share) copia o link curto pra área de
 * transferência. Combustível de alcance orgânico — "indique este negócio".
 */
export function ShareButton({ name, url, className }: { name: string; url: string; className?: string }) {
  async function share() {
    const data = { title: name, text: `Conheça ${name} no Achei no Jardim Botânico`, url }
    const nav = typeof navigator !== "undefined" ? navigator : undefined
    if (nav?.share) {
      try { await nav.share(data) } catch { /* usuário cancelou — ok */ }
      return
    }
    try {
      await nav?.clipboard?.writeText(url)
      toast.success("Link copiado! Cole no WhatsApp ou onde quiser.")
    } catch {
      toast.error("Não consegui copiar o link")
    }
  }

  return (
    <button type="button" onClick={share} className={className}>
      <Share2 className="w-4 h-4 text-flora-green" /> Compartilhar
    </button>
  )
}
