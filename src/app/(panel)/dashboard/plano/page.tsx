import { redirect } from "next/navigation"
import Link from "next/link"
import QRCode from "qrcode"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ShieldCheck, Zap, Crown, Store } from "lucide-react"
import { CheckoutManual } from "./_components/checkout-manual"
import { FreePlanButton } from "./_components/free-plan-button"
import { formatBRL, planDisplayFeatures, type PlanId } from "@/lib/plans"
import { getPlanConfigs } from "@/lib/plan-config"

export default async function PlanoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, plan: true, planExpiresAt: true, name: true },
  })

  if (!business) return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold dash-title">Meu Plano</h1>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <Store className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
        <h2 className="font-semibold dash-title mb-1">Nenhum negócio vinculado</h2>
        <p className="text-sm dash-subtitle mb-4">Reivindique seu negócio para assinar um plano.</p>
        <Link href="/" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">Buscar meu negócio</Link>
      </div>
    </div>
  )

  // Expiração: se o plano pago venceu, volta ao Free automaticamente
  if (business.plan !== "FREE" && business.planExpiresAt && business.planExpiresAt < new Date()) {
    await db.business.update({ where: { id: business.id }, data: { plan: "FREE", planExpiresAt: null } })
    business.plan = "FREE"
    business.planExpiresAt = null
  }

  const plan = business.plan
  const expiresLabel = business.planExpiresAt ? new Date(business.planExpiresAt).toLocaleDateString("pt-BR") : null
  const config = await db.paymentConfig.findUnique({ where: { id: "default" } })

  // Gera o QR Code do PIX copia-e-cola (server-side)
  let qrDataUrl: string | null = null
  if (config?.pixCopyPaste) {
    try {
      qrDataUrl = await QRCode.toDataURL(config.pixCopyPaste, { width: 320, margin: 1 })
    } catch { qrDataUrl = null }
  }

  const cfgs = await getPlanConfigs()
  const visCents = cfgs.VISIBILITY.priceCents
  const premCents = cfgs.PREMIUM.priceCents

  const ICONS: Record<PlanId, { icon: typeof ShieldCheck; color: string }> = {
    FREE: { icon: ShieldCheck, color: "text-gray-500 dark:text-white/40" },
    VISIBILITY: { icon: Zap, color: "text-emerald-600 dark:text-emerald-400" },
    PREMIUM: { icon: Crown, color: "text-amber-600 dark:text-amber-400" },
  }

  const plans = (["FREE", "VISIBILITY", "PREMIUM"] as PlanId[])
    .filter(id => cfgs[id].active || id === plan)
    .map(id => ({
      id,
      name: cfgs[id].label,
      price: cfgs[id].priceCents === 0 ? "Grátis" : `${formatBRL(cfgs[id].priceCents)}/mês`,
      icon: ICONS[id].icon,
      color: ICONS[id].color,
      features: planDisplayFeatures(cfgs[id]),
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Meu Plano</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          <strong className="dash-title">{business.name}</strong> — atual: <strong className="text-emerald-600 dark:text-emerald-400">{plan}</strong>
          {business.planExpiresAt && (
            <span className="ml-2 text-gray-400 dark:text-white/30">(vence em {new Date(business.planExpiresAt).toLocaleDateString("pt-BR")})</span>
          )}
        </p>
      </div>

      {/* Comparativo de planos */}
      <div className="grid sm:grid-cols-3 gap-4">
        {plans.map(p => {
          const isActive = plan === p.id
          return (
            <div key={p.id} className={`rounded-2xl border-2 p-5 space-y-3 ${isActive ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/[0.06]" : "border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02]"}`}>
              <div className="flex items-center gap-2">
                <p.icon className={`w-5 h-5 ${p.color}`} />
                <span className="font-bold dash-title">{p.name}</span>
                {isActive && <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Atual</span>}
              </div>
              <p className="text-2xl font-bold dash-title">{p.price}</p>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="text-xs dash-subtitle flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {/* Ação do plano Free (escolher/voltar) */}
              {p.id === "FREE" && (
                <div className="pt-1">
                  <FreePlanButton currentPlan={plan} expiresLabel={expiresLabel} />
                </div>
              )}
              {p.id !== "FREE" && isActive && (
                <span className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  Plano ativo{expiresLabel ? ` até ${expiresLabel}` : ""}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Checkout manual (PIX / Mercado Pago) */}
      <CheckoutManual
        pixKey={config?.pixKey ?? null}
        pixHolderName={config?.pixHolderName ?? null}
        qrDataUrl={qrDataUrl}
        mpLinks={{ VISIBILITY: cfgs.VISIBILITY.mercadoPagoLink, PREMIUM: cfgs.PREMIUM.mercadoPagoLink }}
        instructions={config?.instructions ?? null}
        priceCents={{ VISIBILITY: visCents, PREMIUM: premCents }}
      />
    </div>
  )
}
