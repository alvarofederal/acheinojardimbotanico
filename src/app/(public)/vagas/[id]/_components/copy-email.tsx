"use client"

import { useState } from "react"
import { Mail, Check } from "lucide-react"

/** Botão que copia o e-mail da vaga para a área de transferência (mais útil que
 *  mailto: — funciona sem cliente de e-mail configurado). Mostra o endereço e
 *  dá feedback "Copiado!" por 2s. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // Fallback p/ contextos sem Clipboard API
      const ta = document.createElement("textarea")
      ta.value = email
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand("copy") } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" onClick={copy} title="Copiar e-mail"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-flora-green/30 dark:border-flora-fresh/40 text-flora-green dark:text-flora-fresh text-sm font-semibold hover:bg-flora-green/5 dark:hover:bg-flora-fresh/10 transition-all max-w-full">
      {copied ? <Check className="w-4 h-4 flex-shrink-0" /> : <Mail className="w-4 h-4 flex-shrink-0" />}
      <span className="truncate">{copied ? "E-mail copiado!" : email}</span>
    </button>
  )
}
