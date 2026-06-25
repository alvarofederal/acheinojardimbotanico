import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import Link from "next/link"
import { ExternalLink, ShieldCheck, Building2, Pencil, Plus } from "lucide-react"
import { PendingActions } from "./_components/pending-actions"
import { businessImage } from "@/lib/display"

interface SearchProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

const STATUS_LABELS: Record<string, string> = {
  IMPORTED: "Importado",
  CLAIMED: "Reivindicado",
  PENDING_REVIEW: "Em revisão",
  SUSPENDED: "Suspenso",
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  VISIBILITY: "Visibilidade",
  PREMIUM: "Premium",
}

export default async function AdminNegociosPage({ searchParams }: SearchProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const { q, status, page } = await searchParams
  const pageNum = parseInt(page ?? "1")
  const take = 30
  const skip = (pageNum - 1) * take

  const where = {
    ...(q ? { name: { contains: q } } : {}),
    ...(status ? { status: status as "IMPORTED" | "CLAIMED" | "PENDING_REVIEW" | "SUSPENDED" } : {}),
  }

  const [businesses, total] = await Promise.all([
    db.business.findMany({
      where,
      include: { category: true, photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } } },
      orderBy: [{ plan: "desc" }, { createdAt: "desc" }],
      take,
      skip,
    }),
    db.business.count({ where }),
  ])

  const totalPages = Math.ceil(total / take)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Negócios</h1>
          <p className="dash-subtitle mt-0.5 text-sm">{total.toLocaleString("pt-BR")} no total</p>
        </div>
        <Link href="/dashboard/admin/negocios/novo"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> Novo negócio
        </Link>
      </div>

      {/* Filtros */}
      <form className="flex gap-3 flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome..."
          className="flex-1 min-w-48 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-transparent dash-title focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] dash-title focus:outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
          Filtrar
        </button>
      </form>

      {/* Tabela */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden md:table-cell">Plano</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {businesses.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const img = businessImage(b)
                        return (
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 bg-white flex items-center justify-center">
                              {img.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img.url} alt={b.name} className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="w-4 h-4 text-gray-300 dark:text-white/20" />
                              )}
                            </div>
                            <span title={img.isLogo ? "Logo curada" : "Sem logo — usando foto/capa"}
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-[#0f1c18] ${img.isLogo ? "bg-emerald-500" : "bg-red-500"}`}
                              style={{ boxShadow: img.isLogo ? "0 0 5px 1px rgba(16,185,129,0.85)" : "0 0 5px 1px rgba(239,68,68,0.85)" }} />
                          </div>
                        )
                      })()}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium dash-title truncate max-w-[200px]">{b.name}</span>
                          {b.ownerId && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs dash-muted truncate max-w-[200px]">{b.neighborhood}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 dash-subtitle hidden sm:table-cell">{b.category.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      b.status === "CLAIMED" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
                      b.status === "SUSPENDED" ? "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400" :
                      "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/50"
                    }`}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs font-medium ${
                      b.plan === "PREMIUM" ? "text-amber-600 dark:text-amber-400" :
                      b.plan === "VISIBILITY" ? "text-emerald-600 dark:text-emerald-400" :
                      "dash-muted"
                    }`}>
                      {PLAN_LABELS[b.plan] ?? b.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {b.status === "PENDING_REVIEW" && <PendingActions businessId={b.id} />}
                      {b.status !== "PENDING_REVIEW" && (
                        <Link href={`/dashboard/admin/negocios/${b.id}`} title="Editar negócio"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 dash-subtitle text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </Link>
                      )}
                      <Link href={`/jardim-botanico/${b.category.slug}/${b.slug}`} target="_blank"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors inline-flex">
                        <ExternalLink className="w-3.5 h-3.5 dash-muted" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs dash-muted">Página {pageNum} de {totalPages}</p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={`?q=${q ?? ""}&status=${status ?? ""}&page=${pageNum - 1}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Anterior
              </Link>
            )}
            {pageNum < totalPages && (
              <Link href={`?q=${q ?? ""}&status=${status ?? ""}&page=${pageNum + 1}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
