import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">
          Olá, {session.user.name?.split(" ")[0] ?? "Usuário"} 👋
        </h1>
        <p className="dash-subtitle mt-0.5 text-sm">Achei no Jardim Botânico — em construção</p>
      </div>
    </div>
  )
}
