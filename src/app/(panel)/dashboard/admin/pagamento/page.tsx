import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { getPlanConfigs } from "@/lib/plan-config"
import { PLAN_IDS } from "@/lib/plans"
import { ConfigForm } from "./_components/config-form"

export default async function PagamentoConfigPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const [config, cfgs] = await Promise.all([
    db.paymentConfig.findUnique({ where: { id: "default" } }),
    getPlanConfigs(),
  ])

  const plans = PLAN_IDS.map(id => cfgs[id])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Planos & Cobrança</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          Defina preço, limites e recursos de cada plano — e como os anunciantes pagam.
        </p>
      </div>
      <ConfigForm payment={config} plans={plans} />
    </div>
  )
}
