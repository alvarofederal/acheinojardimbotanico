"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Search, MapPin, ExternalLink, Copy, Check, Megaphone } from "lucide-react"

export interface FindabilityProps {
  categoryName: string
  neighborhood: string
  businessName: string
  categoryHref: string
  nameSearchHref: string
  /** URL completa pra compartilhar (com https) */
  shareUrl: string
}

/**
 * Mostra ao lojista ONDE ele aparece no guia — presença concreta, sem depender
 * de tráfego. Transforma "estou num guia" em "me acham quando buscam X".
 */
export function FindabilityCard({
  categoryName, neighborhood, businessName, categoryHref, nameSearchHref, shareUrl,
}: FindabilityProps) {
  const [copied, setCopied] = useState(false)
  const shareLabel = shareUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")

  function copy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Link copiado!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/[0.06] p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="font-semibold dash-title">Onde as pessoas te encontram</h2>
          <p className="text-xs dash-muted">Quando alguém do bairro procura, você aparece 👇</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Busca por categoria */}
        <Link href={categoryHref} target="_blank"
          className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors group">
          <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm dash-title font-medium truncate">{categoryName} no {neighborhood}</p>
            <p className="text-xs dash-muted">Você está nesta lista</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 flex-shrink-0">
            ver <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>

        {/* Busca pelo nome */}
        <Link href={nameSearchHref} target="_blank"
          className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors group">
          <Search className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm dash-title font-medium truncate">Busca por &quot;{businessName}&quot;</p>
            <p className="text-xs dash-muted">Seu perfil aparece</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 flex-shrink-0">
            ver <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>

      {/* Link pra divulgar */}
      <div className="pt-1">
        <p className="text-xs dash-muted mb-1.5 flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5" /> Seu link pra divulgar (WhatsApp, Instagram, panfleto):
        </p>
        <button onClick={copy}
          className="w-full flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors text-left">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 truncate flex-1">{shareLabel}</span>
          {copied
            ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            : <Copy className="w-4 h-4 dash-muted flex-shrink-0" />}
        </button>
      </div>
    </div>
  )
}
