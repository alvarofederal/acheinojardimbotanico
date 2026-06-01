import Link from "next/link"
import { Leaf } from "lucide-react"

interface SiteLogoProps {
  href?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

/**
 * Logo oficial — Achei no Jardim Botânico.
 * Fiel ao design original: ícone folha + wordmark em duas cores.
 * Usado no header, footer, login, dashboard e qualquer tela que precise.
 */
export function SiteLogo({ href, size = "md", className = "" }: SiteLogoProps) {
  const sizes = {
    sm: { box: "w-7 h-7 rounded-lg", icon: "w-3.5 h-3.5", text: "text-sm", gap: "gap-1.5" },
    md: { box: "w-8 h-8 rounded-xl", icon: "w-4 h-4",   text: "text-base sm:text-lg", gap: "gap-2" },
    lg: { box: "w-10 h-10 rounded-xl", icon: "w-5 h-5",  text: "text-xl", gap: "gap-2.5" },
  }
  const s = sizes[size]

  const inner = (
    <span className={`inline-flex items-center ${s.gap} select-none ${className}`}>
      <span className={`flex items-center justify-center ${s.box} bg-flora-green/10 dark:bg-flora-fresh/15 flex-shrink-0`}>
        <Leaf className={`${s.icon} text-flora-green dark:text-flora-fresh`} strokeWidth={2.2} />
      </span>
      <span className={`font-serif ${s.text} font-semibold tracking-tight flora-ink leading-none`}>
        Achei no{" "}
        <span className="text-flora-green dark:text-flora-fresh italic">Jardim Botânico</span>
      </span>
    </span>
  )

  if (!href) return inner

  return (
    <Link href={href} className="group hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  )
}
