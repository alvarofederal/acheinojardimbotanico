import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { queryAudit } from "@/lib/audit"
import { AuditList } from "../_components/audit-list"

export const dynamic = "force-dynamic"

interface SearchProps {
  searchParams: Promise<{ q?: string; page?: string; escopo?: string }>
}

/** Auditoria + Histórico mesclados: mesma fonte (AuditLog), o escopo é só um filtro. */
export default async function AdminAuditPage({ searchParams }: SearchProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const { q, page, escopo } = await searchParams
  const onlyBusiness = escopo === "lojistas"

  const { rows, total, totalPages, page: pageNum } = await queryAudit({
    q, page: parseInt(page ?? "1") || 1, take: 10, onlyBusiness,
  })

  const tabCls = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
      active
        ? "bg-emerald-600 text-white"
        : "border border-gray-200 dark:border-white/10 dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5"
    }`

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Auditoria</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          {total.toLocaleString("pt-BR")} eventos · tudo que aconteceu no sistema, com quem e quando
        </p>
      </div>

      {/* Escopo: tudo × só ações ligadas a lojistas (o antigo "Histórico") */}
      <div className="flex gap-2">
        <Link href="/dashboard/admin/audit" className={tabCls(!onlyBusiness)}>Tudo</Link>
        <Link href="/dashboard/admin/audit?escopo=lojistas" className={tabCls(onlyBusiness)}>Ações com lojistas</Link>
      </div>

      <AuditList
        rows={rows} total={total} totalPages={totalPages} page={pageNum} q={q}
        basePath="/dashboard/admin/audit"
        extraQuery={onlyBusiness ? { escopo: "lojistas" } : undefined}
      />
    </div>
  )
}
