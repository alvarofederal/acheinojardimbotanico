import Link from "next/link"
import { Leaf } from "lucide-react"
import { MonsteraLeaf, FernFrond } from "@/app/(public)/_components/botanicals"

/** Moldura visual Flora compartilhada pelas telas de autenticação. */
export function AuthShell({
  subtitle,
  children,
  footer,
}: {
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="min-h-screen flora-bg flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Botânica de fundo */}
      <MonsteraLeaf className="absolute -left-16 -top-10 w-64 h-64 text-flora-green/10 dark:text-flora-fresh/10 flora-wind" />
      <FernFrond className="absolute right-[6%] -bottom-10 w-24 h-64 text-flora-soft/20 flora-wind hidden sm:block" style={{ animationDelay: "1.5s" }} />

      <div className="relative w-full max-w-md flora-card rounded-3xl p-8 z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-flora-green/10 dark:bg-flora-fresh/15">
              <Leaf className="w-5 h-5 text-flora-green dark:text-flora-fresh" strokeWidth={2.2} />
            </span>
            <span className="font-serif text-xl font-semibold flora-ink leading-none">
              Achei no <span className="text-flora-green dark:text-flora-fresh italic">Jardim Botânico</span>
            </span>
          </Link>
          <p className="text-sm mt-3 flora-muted">{subtitle}</p>
        </div>

        {children}

        {footer && <p className="text-center text-sm mt-6 flora-muted">{footer}</p>}
      </div>
    </div>
  )
}

/** Classes Flora reutilizadas pelos inputs/labels dos forms de auth. */
export const authInputCls =
  "w-full pl-10 pr-3 py-3 rounded-xl text-sm flora-ink bg-white/70 dark:bg-white/[0.04] border border-flora-green/15 dark:border-white/10 placeholder:text-flora-ink/30 focus:outline-none focus:border-flora-fresh focus:ring-2 focus:ring-flora-fresh/30 transition-all"
export const authLabelCls = "block text-xs font-semibold mb-1.5 uppercase tracking-wide flora-muted"
