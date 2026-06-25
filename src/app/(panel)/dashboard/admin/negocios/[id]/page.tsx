import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { BusinessAdminForm, type BusinessInitial } from "../_components/business-admin-form"
import { profilePath } from "@/lib/links"

export default async function EditNegocioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const { id } = await params
  const [b, categories] = await Promise.all([
    db.business.findUnique({
      where: { id },
      select: {
        id: true, name: true, categoryId: true, phone: true, whatsapp: true, website: true, instagram: true,
        description: true, address: true, neighborhood: true, city: true, state: true, plan: true, handle: true,
        slug: true, status: true, logoUrl: true, category: { select: { slug: true } },
      },
    }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ])
  if (!b) notFound()

  const initial: BusinessInitial = {
    name: b.name, categoryId: b.categoryId,
    phone: b.phone ?? "", whatsapp: b.whatsapp ?? "", website: b.website ?? "", instagram: b.instagram ?? "",
    description: b.description ?? "", address: b.address, neighborhood: b.neighborhood, city: b.city, state: b.state,
    plan: b.plan as BusinessInitial["plan"], handle: b.handle ?? "", active: b.status !== "SUSPENDED", logoUrl: b.logoUrl,
  }

  return (
    <div className="space-y-5">
      <Link href="/dashboard/admin/negocios" className="inline-flex items-center gap-1.5 text-sm dash-muted hover:dash-title transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Negócios
      </Link>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Editar negócio</h1>
          <p className="dash-subtitle mt-0.5 text-sm">{b.name}</p>
        </div>
        <Link href={profilePath({ handle: b.handle, slug: b.slug, neighborhood: b.neighborhood, category: { slug: b.category.slug } })} target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" /> Ver no site
        </Link>
      </div>
      <BusinessAdminForm mode="edit" businessId={b.id} categories={categories} initial={initial} />
    </div>
  )
}
