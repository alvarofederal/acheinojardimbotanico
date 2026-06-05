export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { buildCardData, buildDisplayData } from "@/lib/display"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (q.length < 2) return NextResponse.json({ results: [] })

  const businesses = await db.business.findMany({
    where: { name: { contains: q } },
    select: {
      id: true, name: true, handle: true, slug: true, neighborhood: true,
      whatsapp: true, phone: true, storeCoverUrl: true,
      category: { select: { name: true, slug: true } },
      photos: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
    },
    orderBy: { name: "asc" },
    take: 20,
  })

  const results = businesses.map(b => ({
    id: b.id,
    name: b.name,
    category: b.category.name,
    card: buildCardData(b),
    display: buildDisplayData(b),
  }))

  return NextResponse.json({ results })
}
