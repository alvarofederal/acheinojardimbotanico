import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { queryAudit } from "@/lib/audit"
import { AuditList } from "../_components/audit-list"

export const dynamic = "force-dynamic"

interface SearchProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminHistoricoPage({ searchParams }: SearchProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const { q, page } = await searchParams
  const { rows, total, totalPages, page: pageNum } = await queryAudit({
    q, page: parseInt(page ?? "1") || 1, take: 10, onlyBusiness: true,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Histórico de Ações</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Tudo que você fez pelos lojistas — pagamentos, reivindicações e eventos</p>
      </div>
      <AuditList rows={rows} total={total} totalPages={totalPages} page={pageNum} q={q} basePath="/dashboard/admin/historico" />
    </div>
  )
}
