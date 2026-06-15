import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { type PlanId } from "@/lib/plans"
import { vagaLimit, planHasFeature } from "@/lib/plan-config"
import { VagaManager, type Vaga } from "./_components/vaga-manager"
import { Briefcase, Lock } from "lucide-react"

export default async function VagasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    include: { vagas: { orderBy: { order: "asc" } } },
  })

  if (!business) return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold dash-title">Vagas</h1>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <Briefcase className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
        <h2 className="font-semibold dash-title mb-1">Nenhum negócio vinculado</h2>
        <p className="text-sm dash-subtitle mb-4">Reivindique seu negócio para publicar vagas.</p>
        <Link href="/" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">Buscar meu negócio</Link>
      </div>
    </div>
  )

  const enabled = await planHasFeature(business.plan as PlanId, "vagas")
  const limit = await vagaLimit(business.plan as PlanId)
  const available = enabled && limit > 0

  const vagas: Vaga[] = business.vagas.map(v => ({
    id: v.id, title: v.title, description: v.description, type: v.type,
    email: v.email, showWhatsapp: v.showWhatsapp, active: v.active,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Vagas</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Publique oportunidades — as candidaturas chegam no seu WhatsApp · {business.name}</p>
      </div>

      {available ? (
        <VagaManager vagas={vagas} limit={limit} plan={business.plan} />
      ) : (
        <div className="rounded-2xl border border-dashed border-amber-300/60 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/[0.05] p-8 text-center">
          <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h2 className="font-semibold dash-title mb-1">Vagas não está no seu plano</h2>
          <p className="text-sm dash-subtitle mb-4">O recurso de Vagas é dos planos pagos. Faça upgrade para divulgar oportunidades de emprego no seu perfil e na página pública de Vagas.</p>
          <Link href="/dashboard/plano" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">Ver planos</Link>
        </div>
      )}
    </div>
  )
}
