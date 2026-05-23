import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

interface SearchProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

const ACTION_LABELS: Record<string, string> = {
  "business.import": "Importação de negócios",
  "claim.created": "Reivindicação criada",
  "claim.approved": "Reivindicação aprovada",
  "claim.rejectd": "Reivindicação rejeitada",
  "user.lgpd_delete": "Exclusão LGPD",
}

export default async function AdminAuditPage({ searchParams }: SearchProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const { q, page } = await searchParams
  const pageNum = parseInt(page ?? "1")
  const take = 50
  const skip = (pageNum - 1) * take

  const where = q ? { OR: [
    { action: { contains: q } },
    { entity: { contains: q } },
    { entityId: { contains: q } },
  ]} : {}

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    db.auditLog.count({ where }),
  ])

  const totalPages = Math.ceil(total / take)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Log de Auditoria</h1>
        <p className="dash-subtitle mt-0.5 text-sm">{total.toLocaleString("pt-BR")} eventos registrados</p>
      </div>

      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por ação, entidade ou ID..."
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
          Buscar
        </button>
      </form>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Ação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden sm:table-cell">Entidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden md:table-cell">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium dash-title">{ACTION_LABELS[log.action] ?? log.action}</p>
                    <p className="text-xs dash-muted font-mono">{log.action}</p>
                  </td>
                  <td className="px-4 py-3 dash-subtitle hidden sm:table-cell">
                    {log.entity}
                    <span className="text-xs dash-muted block font-mono truncate max-w-[160px]">{log.entityId}</span>
                  </td>
                  <td className="px-4 py-3 text-xs dash-muted hidden md:table-cell whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-12 text-center dash-muted text-sm">Nenhum evento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs dash-muted">Página {pageNum} de {totalPages}</p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a href={`?q=${q ?? ""}&page=${pageNum - 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Anterior</a>
            )}
            {pageNum < totalPages && (
              <a href={`?q=${q ?? ""}&page=${pageNum + 1}`} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Próxima</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
