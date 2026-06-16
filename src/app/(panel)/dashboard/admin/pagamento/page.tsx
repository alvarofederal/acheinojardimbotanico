import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { getPlanConfigsFresh } from "@/lib/plan-config"
import { PLAN_IDS } from "@/lib/plans"
import { ConfigForm } from "./_components/config-form"
import { SiteVisibilityForm, type SiteCfg } from "./_components/site-visibility-form"

export const dynamic = "force-dynamic"

export default async function PagamentoConfigPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const [config, cfgs, siteCfg] = await Promise.all([
    db.paymentConfig.findUnique({ where: { id: "default" } }),
    getPlanConfigsFresh(),
    db.siteConfig.findUnique({ where: { id: "default" } }),
  ])

  const plans = PLAN_IDS.map(id => cfgs[id])
  const site: SiteCfg = {
    showPromocoes: siteCfg?.showPromocoes ?? false,
    showNoticias: siteCfg?.showNoticias ?? false,
    showEventos: siteCfg?.showEventos ?? false,
    showVagas: siteCfg?.showVagas ?? false,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Planos & Cobrança</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          Defina preço, limites e recursos de cada plano — e como os anunciantes pagam.
        </p>
      </div>
      <ConfigForm payment={config} plans={plans} />
      <SiteVisibilityForm site={site} />
    </div>
  )
}
