import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { BusinessEditor } from "./_components/business-editor"
import { HoursEditor } from "./_components/hours-editor"
import { PhotoManager } from "./_components/photo-manager"
import { HandleEditor } from "./_components/handle-editor"
import { OfferEditor } from "./_components/offer-editor"
import { parseOpeningHours } from "@/lib/opening-hours"
import { photoLimit, getPlanConfig } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { slugify, SITE_URL } from "@/lib/utils"
import Link from "next/link"
import { Store, ShieldCheck } from "lucide-react"

export default async function NegocioPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    include: { category: true, photos: { orderBy: { order: "asc" } } },
  })

  // Sem negócio reivindicado
  if (!business) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Meu Negócio</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Gerencie as informações do seu estabelecimento</p>
      </div>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
        <Store className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
        <h2 className="text-lg font-semibold dash-title mb-2">Nenhum negócio vinculado</h2>
        <p className="dash-subtitle text-sm mb-6 max-w-sm mx-auto">
          Seu negócio já pode estar cadastrado. Encontre-o na listagem e reivindique o perfil.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
            <ShieldCheck className="w-4 h-4" />
            Buscar e reivindicar meu negócio
          </Link>
          <Link href="/dashboard/negocio/novo" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 dash-title text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Store className="w-4 h-4" />
            Não está no guia? Cadastrar
          </Link>
        </div>
      </div>
    </div>
  )

  const fotoLimit = await photoLimit(business.plan as PlanId)
  const planCfg = await getPlanConfig(business.plan as PlanId)
  const deadlineYmd = business.offerDeadline
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(business.offerDeadline)
    : ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Meu Negócio</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Informações de <strong className="dash-title">{business.name}</strong></p>
      </div>
      <BusinessEditor business={business} />
      <div className="pt-6 border-t border-gray-100 dark:border-white/[0.06]">
        <HoursEditor
          openingHours={business.openingHours}
          feriadoFechadoInicial={parseOpeningHours(business.openingHours)?.feriadoFechado ?? false}
        />
      </div>
      <OfferEditor
        enabled={planCfg.features.oferta}
        initialActive={business.offerActive}
        initialTitle={business.offerTitle ?? ""}
        initialText={business.offerText ?? ""}
        initialDeadline={deadlineYmd}
      />
      <HandleEditor
        initialHandle={business.handle}
        suggested={slugify(business.name).slice(0, 40)}
        siteUrl={SITE_URL}
      />
      <div className="pt-6 border-t border-gray-100 dark:border-white/[0.06]">
        <PhotoManager
          photos={business.photos}
          plan={business.plan}
          limit={fotoLimit}
        />
      </div>
    </div>
  )
}
