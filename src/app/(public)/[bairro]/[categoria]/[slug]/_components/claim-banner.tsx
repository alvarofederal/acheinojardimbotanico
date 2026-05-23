"use client"

import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export function ClaimBanner({ businessId, businessName }: { businessId: string; businessName: string }) {
  return (
    <div className="mt-8 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 flex items-center gap-4">
      <ShieldCheck className="w-8 h-8 text-emerald-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/80">Este negócio é seu?</p>
        <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Reivindique o perfil de <strong className="text-gray-600 dark:text-white/50">{businessName}</strong> e adicione informações, fotos e promoções.</p>
      </div>
      <Link
        href={`/reivindicar/${businessId}`}
        className="flex-shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
      >
        Reivindicar
      </Link>
    </div>
  )
}
