import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { Eye, MessageCircle, TrendingUp, Store, Clock } from "lucide-react"
import Link from "next/link"
import { OnboardingChecklist, type OnboardingStep } from "./_components/onboarding-checklist"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"

  const business = !isAdmin ? await db.business.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true, name: true, slug: true, plan: true, status: true, description: true, whatsapp: true,
      category: { select: { slug: true } },
    },
  }) : null

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [views7d, clicks7d, ownerPhotos, productCount] = business ? await Promise.all([
    db.businessView.aggregate({
      where: { businessId: business.id, date: { gte: sevenDaysAgo } },
      _sum: { count: true },
    }),
    db.whatsappClick.aggregate({
      where: { businessId: business.id, date: { gte: sevenDaysAgo } },
      _sum: { count: true },
    }),
    db.photo.count({ where: { businessId: business.id, source: "OWNER_UPLOAD" } }),
    db.product.count({ where: { businessId: business.id } }),
  ]) : [{ _sum: { count: 0 } }, { _sum: { count: 0 } }, 0, 0]

  // Passos de onboarding (só para anunciante com negócio)
  const onboardingSteps: OnboardingStep[] = business ? [
    { label: "Adicione uma descrição", hint: "Conte o que seu negócio oferece", done: !!business.description, href: "/dashboard/negocio" },
    { label: "Informe seu WhatsApp", hint: "O canal nº1 de contato dos clientes", done: !!business.whatsapp, href: "/dashboard/negocio" },
    { label: "Envie fotos do seu negócio", hint: "Perfis com foto recebem mais cliques", done: (ownerPhotos as number) > 0, href: "/dashboard/negocio" },
    { label: "Cadastre seu primeiro produto", hint: "Monte sua vitrine e venda pelo WhatsApp", done: (productCount as number) > 0, href: "/dashboard/produtos" },
    { label: "Escolha um plano", hint: "Apareça em destaque e libere mais recursos", done: business.plan !== "FREE", href: "/dashboard/plano" },
  ] : []

  const firstName = session.user.name?.split(" ")[0] ?? "Usuário"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Olá, {firstName} 👋</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          {isAdmin ? "Painel administrativo" : "Visão geral do seu negócio"}
        </p>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Ver negócios",    href: "/dashboard/admin/negocios", color: "text-blue-600 dark:text-blue-400" },
            { label: "Importar",        href: "/dashboard/admin/import",   color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Reivindicações",  href: "/dashboard/admin/claims",   color: "text-amber-600 dark:text-amber-400" },
            { label: "Usuários",        href: "/dashboard/admin/usuarios", color: "text-purple-600 dark:text-purple-400" },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="p-4 rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] hover:border-gray-200 dark:hover:border-white/[0.12] transition-colors text-center">
              <p className={`text-sm font-semibold ${a.color}`}>{a.label}</p>
            </Link>
          ))}
        </div>
      )}

      {!isAdmin && !business && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
          <Store className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
          <h2 className="font-semibold dash-title mb-1">Nenhum negócio vinculado</h2>
          <p className="text-sm dash-subtitle mb-4">Encontre seu negócio no guia e reivindique o perfil.</p>
          <Link href="/" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">
            Buscar meu negócio
          </Link>
        </div>
      )}

      {!isAdmin && business && (
        <>
          {business.status === "PENDING_REVIEW" && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/[0.06] p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>{business.name}</strong> está <strong>em análise</strong>. Assim que aprovarmos, ele aparece no guia. Aproveite para já completar o perfil abaixo. 👇
              </p>
            </div>
          )}

          <OnboardingChecklist steps={onboardingSteps} />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Visualizações (7d)",    value: views7d._sum.count  ?? 0, icon: Eye,            color: "text-blue-500 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10" },
              { label: "Cliques WhatsApp (7d)", value: clicks7d._sum.count ?? 0, icon: MessageCircle,  color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
              { label: "Plano atual",           value: business.plan,            icon: TrendingUp,     color: "text-amber-500 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10", isText: true },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-4">
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold dash-title">
                  {s.isText ? s.value : Number(s.value).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs dash-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/dashboard/negocio"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
              Editar perfil
            </Link>
            {business.plan === "FREE" && (
              <Link href="/dashboard/plano"
                className="px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                Fazer upgrade
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
