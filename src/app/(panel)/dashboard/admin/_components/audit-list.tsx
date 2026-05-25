import Link from "next/link"
import { Search, Store } from "lucide-react"
import { actionLabel, type AuditRow } from "@/lib/audit"

const ACTION_TONE: Record<string, string> = {
  "payment.confirmed": "text-emerald-600 dark:text-emerald-400",
  "claim.approved": "text-emerald-600 dark:text-emerald-400",
  "event.approve": "text-emerald-600 dark:text-emerald-400",
  "payment.rejected": "text-red-500",
  "claim.rejected": "text-red-500",
  "claim.rejectd": "text-red-500",
  "event.reject": "text-red-500",
  "PLAN_EXPIRED": "text-amber-600 dark:text-amber-400",
  "user.lgpd_delete": "text-red-500",
}

/** Listagem de auditoria com busca por lojista + paginação. Server component. */
export function AuditList({
  rows, total, totalPages, page, q, basePath,
}: {
  rows: AuditRow[]; total: number; totalPages: number; page: number; q?: string; basePath: string
}) {
  const pageHref = (p: number) => `${basePath}?q=${encodeURIComponent(q ?? "")}&page=${p}`

  return (
    <div className="space-y-4">
      {/* Busca por lojista */}
      <form action={basePath} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Pesquisar lojista pelo nome..."
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
          Buscar
        </button>
        {q && (
          <Link href={basePath} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Limpar
          </Link>
        )}
      </form>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Ação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Lojista</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden md:table-cell whitespace-nowrap">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className={`font-medium ${ACTION_TONE[r.action] ?? "dash-title"}`}>{actionLabel(r.action)}</p>
                    <p className="text-xs dash-muted font-mono">{r.action}</p>
                  </td>
                  <td className="px-4 py-3 dash-subtitle">
                    {r.businessName ? (
                      <span className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-gray-400 dark:text-white/30 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{r.businessName}</span>
                      </span>
                    ) : (
                      <span className="dash-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs dash-muted hidden md:table-cell whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-12 text-center dash-muted text-sm">
                  {q ? `Nenhuma ação encontrada para "${q}".` : "Nenhuma ação registrada ainda."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs dash-muted">Página {page} de {totalPages} · {total.toLocaleString("pt-BR")} no total</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Anterior</Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Próxima</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
