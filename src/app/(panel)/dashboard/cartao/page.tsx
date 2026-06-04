import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { buildCardData } from "@/lib/display"
import { CardCard } from "@/components/card-card"
import { FeatureLocked } from "../_components/feature-locked"
import { planHasFeature } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { Printer, CreditCard, Store } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CartaoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true, name: true, plan: true, handle: true, slug: true, neighborhood: true,
      whatsapp: true, phone: true, storeCoverUrl: true,
      category: { select: { name: true, slug: true } },
      photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
    },
  })

  if (!business) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Cartão de visita</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Seu cartão com QR Code, pra distribuir</p>
      </div>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <Store className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
        <p className="text-sm dash-subtitle">Reivindique seu negócio para gerar o cartão.</p>
      </div>
    </div>
  )

  if (!(await planHasFeature(business.plan as PlanId, "cartao")))
    return <FeatureLocked title="Cartão de visita" feature="Cartão de visita" />

  const data = buildCardData(business)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Cartão de visita</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Imprima e distribua. Quem receber escaneia e te acha no guia.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-sm dash-subtitle space-y-1">
          <p className="font-medium dash-title">Como usar:</p>
          <p>1. Clique em <strong>Imprimir</strong> e escolha o tamanho <strong>9×5 cm</strong>.</p>
          <p>2. Para PDF, escolha <strong>&quot;Salvar como PDF&quot;</strong>.</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        <div className="rounded-xl shadow-lg" style={{ boxShadow: "0 10px 40px rgba(30,92,69,0.18)" }}>
          <CardCard data={data} />
        </div>
        <Link href={`/card-print/${business.id}`} target="_blank"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Printer className="w-4 h-4" /> Imprimir / Gerar PDF
        </Link>
      </div>
    </div>
  )
}
