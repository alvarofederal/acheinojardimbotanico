import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DeleteAccount } from "./_components/delete-account"

export default async function ContaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Minha Conta</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Gerencie seus dados e privacidade</p>
      </div>

      {/* Dados básicos */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 space-y-3">
        <h2 className="font-semibold dash-title text-sm uppercase tracking-wide">Dados da conta</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="dash-muted">Nome</span>
            <span className="dash-subtitle">{session.user.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="dash-muted">Email</span>
            <span className="dash-subtitle">{session.user.email}</span>
          </div>
        </div>
      </div>

      {/* LGPD */}
      <DeleteAccount />
    </div>
  )
}
