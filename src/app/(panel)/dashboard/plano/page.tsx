import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ShieldCheck, Zap, Crown } from "lucide-react"

export default async function PlanoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    select: { plan: true, planExpiresAt: true, name: true },
  })

  const plan = business?.plan ?? "FREE"

  const plans = [
    {
      id: "FREE",
      name: "Free",
      price: "Grátis",
      icon: ShieldCheck,
      color: "text-gray-500 dark:text-white/40",
      bg: "bg-gray-50 dark:bg-white/[0.03]",
      border: "border-gray-200 dark:border-white/[0.07]",
      features: ["Perfil básico no guia", "Endereço e telefone", "Visualizações básicas"],
    },
    {
      id: "VISIBILITY",
      name: "Visibilidade",
      price: "R$ 79/mês",
      icon: Zap,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/[0.06]",
      border: "border-emerald-200 dark:border-emerald-500/20",
      features: ["Destaque na listagem", "Descrição personalizada", "Até 6 fotos", "Métricas detalhadas", "Badge Destaque"],
      cta: "Assinar Visibilidade",
    },
    {
      id: "PREMIUM",
      name: "Premium",
      price: "R$ 197/mês",
      icon: Crown,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/[0.06]",
      border: "border-amber-200 dark:border-amber-500/20",
      features: ["Topo garantido na listagem", "Até 20 fotos", "Todas as métricas", "Badge Premium", "Prioridade no suporte"],
      cta: "Assinar Premium",
    },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Meu Plano</h1>
        {business && (
          <p className="dash-subtitle mt-0.5 text-sm">
            <strong className="dash-title">{business.name}</strong> — Plano atual: <strong className="text-emerald-600 dark:text-emerald-400">{plan}</strong>
            {business.planExpiresAt && (
              <span className="ml-2 text-gray-400 dark:text-white/30">
                (vence em {new Date(business.planExpiresAt).toLocaleDateString("pt-BR")})
              </span>
            )}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {plans.map(p => {
          const isActive = plan === p.id
          return (
            <div key={p.id} className={`rounded-2xl border-2 p-5 space-y-4 transition-all ${isActive ? p.border + " " + p.bg : "border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02]"}`}>
              <div className="flex items-center gap-2">
                <p.icon className={`w-5 h-5 ${p.color}`} />
                <span className={`font-bold ${isActive ? p.color : "dash-title"}`}>{p.name}</span>
                {isActive && <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Atual</span>}
              </div>
              <p className="text-2xl font-bold dash-title">{p.price}</p>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="text-xs dash-subtitle flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.cta && !isActive && (
                <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  p.id === "PREMIUM"
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}>
                  {p.cta}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs dash-muted">
        Pagamento via PIX, cartão de crédito ou boleto. Integração com Asaas — em breve.
      </p>
    </div>
  )
}
