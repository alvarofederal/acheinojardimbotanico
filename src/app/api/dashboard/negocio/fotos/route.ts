export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { photoLimit as photoLimitFor } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { z } from "zod"

const schema = z.object({ url: z.string().url() })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: "URL inválida" }, { status: 400 })

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ error: "Nenhum negócio vinculado" }, { status: 404 })

  const limit = await photoLimitFor(business.plan as PlanId)
  const ownerPhotos = await db.photo.count({
    where: { businessId: business.id, source: "OWNER_UPLOAD" },
  })

  if (ownerPhotos >= limit) {
    return NextResponse.json(
      { error: `Limite de ${limit} fotos atingido no plano ${business.plan}. Faça upgrade para adicionar mais.` },
      { status: 403 }
    )
  }

  const maxOrder = await db.photo.aggregate({
    where: { businessId: business.id },
    _max: { order: true },
  })

  const photo = await db.photo.create({
    data: {
      businessId: business.id,
      url: v.data.url,
      source: "OWNER_UPLOAD",
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  return NextResponse.json({ photo })
}
