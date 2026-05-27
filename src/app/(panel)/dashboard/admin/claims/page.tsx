import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ClaimsTable } from "./_components/claims-table"

export default async function AdminClaimsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const claims = await db.claimRequest.findMany({
    where: { status: "PENDING" },
    include: {
      business: { select: { id: true, name: true, slug: true, neighborhood: true, phone: true, whatsapp: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Reivindicações</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          {claims.length} pendente{claims.length !== 1 ? "s" : ""}
        </p>
      </div>
      <ClaimsTable claims={claims} />
    </div>
  )
}
