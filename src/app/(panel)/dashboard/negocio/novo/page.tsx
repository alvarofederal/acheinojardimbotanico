import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ArrowLeft } from "lucide-react"
import { BusinessRegisterForm } from "./_components/business-register-form"

export default async function NovoNegocioPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Já tem negócio? Vai direto pro painel do negócio
  const existing = await db.business.findFirst({ where: { ownerId: session.user.id }, select: { id: true } })
  if (existing) redirect("/dashboard/negocio")

  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/dashboard/negocio" className="inline-flex items-center gap-1.5 text-sm dash-subtitle hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Cadastrar meu negócio</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          Não encontrou seu negócio no guia? Cadastre aqui — ideal para quem atende em casa ou ainda não está no Google.
        </p>
      </div>
      <BusinessRegisterForm categories={categories} />
    </div>
  )
}
