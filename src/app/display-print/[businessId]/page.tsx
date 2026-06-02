import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { buildDisplayData } from "@/lib/display"
import { PrintView } from "./print-view"

export const dynamic = "force-dynamic"

export default async function DisplayPrintPage({ params }: { params: Promise<{ businessId: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { businessId } = await params

  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      id: true, name: true, handle: true, slug: true, neighborhood: true, ownerId: true, storeCoverUrl: true,
      category: { select: { name: true, slug: true } },
      photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
    },
  })

  if (!business) notFound()

  // Permissão: admin vê qualquer um; anunciante só o próprio negócio
  const isAdmin = session.user.role === "ADMIN"
  if (!isAdmin && business.ownerId !== session.user.id) redirect("/dashboard")

  // Nome do arquivo no "Salvar como PDF" = slug/handle da loja
  const filename = `display-${business.handle ?? business.slug}`

  return <PrintView data={buildDisplayData(business)} filename={filename} />
}
