import Link from "next/link"
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react"

export interface OnboardingStep {
  label: string
  hint: string
  done: boolean
  href: string
}

/** Checklist "complete seu perfil" — guia o anunciante pelos primeiros passos. */
export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter(s => s.done).length
  const total = steps.length
  const pct = Math.round((doneCount / total) * 100)
  const allDone = doneCount === total

  if (allDone) return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/[0.06] p-5 flex items-center gap-3">
      <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      <div>
        <p className="font-semibold text-emerald-800 dark:text-emerald-300">Perfil completo! 🎉</p>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-400/70">Tudo pronto — seu negócio está aproveitando o máximo do guia.</p>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold dash-title">Complete seu perfil</h2>
          <p className="text-xs dash-muted mt-0.5">Quanto mais completo, mais clientes você atrai.</p>
        </div>
        <span className="text-sm font-semibold dash-title flex-shrink-0">{doneCount}/{total}</span>
      </div>

      {/* Barra de progresso */}
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="divide-y divide-gray-50 dark:divide-white/[0.04]">
        {steps.map(s => (
          <li key={s.label}>
            <Link href={s.href} className="flex items-center gap-3 py-2.5 group">
              {s.done
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                : <Circle className="w-5 h-5 text-gray-300 dark:text-white/20 flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${s.done ? "dash-muted line-through" : "dash-title"}`}>{s.label}</p>
                {!s.done && <p className="text-xs dash-muted">{s.hint}</p>}
              </div>
              {!s.done && <ArrowRight className="w-4 h-4 dash-muted group-hover:translate-x-0.5 transition-transform flex-shrink-0" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
