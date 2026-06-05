import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { CourtesyButton } from "./_components/courtesy-button"
import { DisplayButton } from "./_components/display-button"
import { NewUserButton, UserRowActions } from "./_components/user-admin"
import { ActiveToggle } from "../negocios/_components/active-toggle"
import { CardButton } from "./_components/card-button"
import { buildDisplayData, buildCardData } from "@/lib/display"
import { Store, MessageCircle } from "lucide-react"

export const dynamic = "force-dynamic"

interface SearchProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

const ROLE_LABELS: Record<string, string> = {
  VISITOR: "Visitante",
  ADVERTISER: "Anunciante",
  ADMIN: "Admin",
}

export default async function AdminUsuariosPage({ searchParams }: SearchProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const { q, page } = await searchParams
  const pageNum = parseInt(page ?? "1")
  const take = 30
  const skip = (pageNum - 1) * take

  const where = q ? { OR: [
    { name: { contains: q } },
    { email: { contains: q } },
  ]} : {}

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true, active: true },
      orderBy: { createdAt: "desc" },
      take, skip,
    }),
    db.user.count({ where }),
  ])

  // Negócios desses usuários (pra liberar cortesia ao lojista)
  const businesses = await db.business.findMany({
    where: { ownerId: { in: users.map(u => u.id) } },
    select: {
      id: true, name: true, ownerId: true, plan: true, planIsCourtesy: true, planExpiresAt: true,
      whatsapp: true, phone: true, handle: true, slug: true, neighborhood: true, storeCoverUrl: true, status: true,
      category: { select: { name: true, slug: true } },
      photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
    },
  })
  const bizByOwner = new Map(businesses.map(b => [b.ownerId!, b]))

  const totalPages = Math.ceil(total / take)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Usuários</h1>
          <p className="dash-subtitle mt-0.5 text-sm">{total.toLocaleString("pt-BR")} cadastrados</p>
        </div>
        <NewUserButton />
      </div>

      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou email..."
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide">Usuário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden lg:table-cell">Negócio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden md:table-cell">Cadastro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium dash-title">{u.name ?? u.email?.split("@")[0] ?? "—"}</p>
                      {!u.active && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400">INATIVO</span>}
                    </div>
                    <p className="text-xs dash-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {bizByOwner.has(u.id) ? (() => {
                      const b = bizByOwner.get(u.id)!
                      const contact = b.whatsapp || b.phone
                      return (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="text-sm font-medium dash-title truncate max-w-[180px]">{b.name}</span>
                          </div>
                          {contact && (
                            <a href={`https://wa.me/${contact.replace(/\D/g, "")}`} target="_blank"
                              className="flex items-center gap-1 mt-0.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                              <MessageCircle className="w-3 h-3" />
                              {contact}
                            </a>
                          )}
                        </div>
                      )
                    })() : <span className="text-xs dash-muted">—</span>}
                  </td>

                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      u.role === "ADMIN" ? "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400" :
                      u.role === "ADVERTISER" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
                      "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/50"
                    }`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs dash-muted hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {u.emailVerified
                      ? <span className="text-xs text-emerald-600 dark:text-emerald-400">Verificado</span>
                      : <span className="text-xs text-amber-500 dark:text-amber-400">Pendente</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end flex-wrap">
                      {bizByOwner.has(u.id) && (() => {
                        const b = bizByOwner.get(u.id)!
                        return (
                          <>
                            <ActiveToggle businessId={b.id} businessName={b.name} active={b.status !== "SUSPENDED"} hasOwner={true} />
                            <DisplayButton businessId={b.id} data={buildDisplayData(b)} />
                            <CardButton businessId={b.id} data={buildCardData(b)} />
                            <CourtesyButton businessId={b.id} businessName={b.name} currentPlan={b.plan} isCourtesy={b.planIsCourtesy ?? false} />
                          </>
                        )
                      })()}
                      <UserRowActions id={u.id} name={u.name} role={u.role} isSelf={u.id === session.user.id}
                        business={(() => { const ub = bizByOwner.get(u.id); return ub ? { id: ub.id, active: ub.status !== "SUSPENDED" } : undefined })()} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs dash-muted">Página {pageNum} de {totalPages}</p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a href={`?q=${q ?? ""}&page=${pageNum - 1}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Anterior
              </a>
            )}
            {pageNum < totalPages && (
              <a href={`?q=${q ?? ""}&page=${pageNum + 1}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Próxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
