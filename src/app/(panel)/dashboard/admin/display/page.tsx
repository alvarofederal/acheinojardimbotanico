import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DisplayHub } from "./_components/display-hub"

export const dynamic = "force-dynamic"

export default async function AdminDisplayPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Displays</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Busque um negócio e gere o display A6 (QR pro perfil) — imprime e coloca no balcão.</p>
      </div>
      <DisplayHub />
    </div>
  )
}
