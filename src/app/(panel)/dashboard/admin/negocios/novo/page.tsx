import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ArrowLeft } from "lucide-react"
import { BusinessAdminForm } from "../_components/business-admin-form"

export default async function NovoNegocioPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const categories = await db.category.findMany({ select: { id: true, name: true }, orderBy: [{ order: "asc" }, { name: "asc" }] })

  return (
    <div className="space-y-5">
      <Link href="/dashboard/admin/negocios" className="inline-flex items-center gap-1.5 text-sm dash-muted hover:dash-title transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Negócios
      </Link>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Novo negócio</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Cadastro manual — sem passar pelo Google. O endereço captura as coordenadas pro mapa.</p>
      </div>
      <BusinessAdminForm mode="create" categories={categories} />
    </div>
  )
}
