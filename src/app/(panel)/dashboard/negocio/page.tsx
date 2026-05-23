import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { BusinessEditor } from "./_components/business-editor"
import { PhotoManager } from "./_components/photo-manager"
import { PHOTO_LIMITS } from "@/app/api/dashboard/negocio/fotos/route"
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
    <div className="space-y-6 max-w-2xl">
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
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
            <ShieldCheck className="w-4 h-4" />
            Buscar e reivindicar meu negócio
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Meu Negócio</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Informações de <strong className="dash-title">{business.name}</strong></p>
      </div>
      <BusinessEditor business={business} />
      <div className="pt-6 border-t border-gray-100 dark:border-white/[0.06]">
        <PhotoManager
          photos={business.photos}
          plan={business.plan}
          limit={PHOTO_LIMITS[business.plan] ?? 3}
        />
      </div>
    </div>
  )
}
