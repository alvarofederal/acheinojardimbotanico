import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Building2, Users, ShieldCheck, Eye } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const [totalBusinesses, totalClaimed, totalUsers, pendingClaims, totalViews] = await Promise.all([
    db.business.count(),
    db.business.count({ where: { status: "CLAIMED" } }),
    db.user.count(),
    db.claimRequest.count({ where: { status: "PENDING" } }),
    db.businessView.aggregate({ _sum: { count: true } }),
  ])

  const stats = [
    { label: "Negócios", value: totalBusinesses, icon: Building2, href: "/dashboard/admin/negocios", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Reivindicados", value: totalClaimed, icon: ShieldCheck, href: "/dashboard/admin/claims", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Usuários", value: totalUsers, icon: Users, href: "/dashboard/admin/usuarios", color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Visualizações", value: totalViews._sum.count ?? 0, icon: Eye, href: "#", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Painel Admin</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Visão geral do Achei no Jardim Botânico</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4 hover:border-gray-200 dark:hover:border-white/[0.12] transition-colors">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold dash-title">{s.value.toLocaleString("pt-BR")}</p>
            <p className="text-xs dash-muted mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {pendingClaims > 0 && (
        <Link href="/dashboard/admin/claims"
          className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {pendingClaims} reivindicação{pendingClaims > 1 ? "ões" : ""} pendente{pendingClaims > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Clique para revisar</p>
          </div>
        </Link>
      )}
    </div>
  )
}
