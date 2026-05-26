import Link from "next/link"
import { Lock, Zap } from "lucide-react"

/** Card de upsell exibido quando o plano atual não libera um recurso. */
export function FeatureLocked({ title, feature }: { title: string; feature: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">{title}</h1>
      </div>
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.06] p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="font-semibold dash-title mb-1">{feature} é um recurso de plano pago</h2>
        <p className="text-sm dash-subtitle mb-5 max-w-sm mx-auto">
          Faça upgrade para liberar este recurso e aproveitar tudo que o Achei oferece para o seu negócio.
        </p>
        <Link href="/dashboard/plano"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Zap className="w-4 h-4" /> Ver planos
        </Link>
      </div>
    </div>
  )
}
