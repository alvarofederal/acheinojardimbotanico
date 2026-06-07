import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { buildCardData } from "@/lib/display"
import { slugify } from "@/lib/utils"
import { CardPrintView } from "@/components/card-print-view"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ businessId: string }> }): Promise<Metadata> {
  const { businessId } = await params
  const b = await db.business.findUnique({ where: { id: businessId }, select: { name: true } })
  return { title: { absolute: b ? `cartao-${slugify(b.name)}` : "cartao" } }
}

export default async function CardPrintPage({ params }: { params: Promise<{ businessId: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { businessId } = await params
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: {
      id: true, name: true, handle: true, slug: true, neighborhood: true, ownerId: true,
      whatsapp: true, phone: true, storeCoverUrl: true, logoUrl: true,
      category: { select: { name: true, slug: true } },
      photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
    },
  })
  if (!business) notFound()

  const isAdmin = session.user.role === "ADMIN"
  if (!isAdmin && business.ownerId !== session.user.id) redirect("/dashboard")

  return <CardPrintView data={buildCardData(business)} filename={`cartao-${business.handle ?? business.slug}`} />
}
