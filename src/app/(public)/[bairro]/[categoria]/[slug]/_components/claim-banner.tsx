"use client"

import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export function ClaimBanner({ businessId, businessName }: { businessId: string; businessName: string }) {
  return (
    <div className="mt-8 p-5 rounded-3xl flora-card flex items-center gap-4">
      <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-flora-green/10 dark:bg-flora-fresh/15 flex-shrink-0">
        <ShieldCheck className="w-6 h-6 text-flora-green dark:text-flora-fresh" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-base font-semibold flora-ink">Este negócio é seu?</p>
        <p className="text-xs flora-muted mt-0.5">Reivindique o perfil de <strong className="flora-ink">{businessName}</strong> e cuide das informações, fotos e destaques.</p>
      </div>
      <Link
        href={`/reivindicar/${businessId}`}
        className="flex-shrink-0 px-5 py-2.5 rounded-full bg-flora-green hover:bg-flora-fresh text-white text-sm font-semibold transition-all hover:shadow-lg"
      >
        Reivindicar
      </Link>
    </div>
  )
}
