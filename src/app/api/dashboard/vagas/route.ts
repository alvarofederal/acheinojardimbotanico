export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { type PlanId } from "@/lib/plans"
import { vagaLimit, planHasFeature } from "@/lib/plan-config"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(4000),
  type: z.string().max(30).nullable().optional(),
  email: z.string().email().max(120).nullable().optional(),
  showWhatsapp: z.boolean().default(true),
  active: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ error: "Nenhum negócio vinculado" }, { status: 404 })

  // Gate: o plano precisa liberar o recurso de vagas E ter limite > 0.
  const enabled = await planHasFeature(business.plan as PlanId, "vagas")
  const limit = await vagaLimit(business.plan as PlanId)
  if (!enabled || limit <= 0) {
    return NextResponse.json(
      { error: `Seu plano (${business.plan}) não inclui Vagas. Faça upgrade para publicar.` },
      { status: 403 }
    )
  }

  const count = await db.vaga.count({ where: { businessId: business.id } })
  if (count >= limit) {
    return NextResponse.json(
      { error: `Limite de ${limit} vagas atingido no plano ${business.plan}. Faça upgrade para adicionar mais.` },
      { status: 403 }
    )
  }

  const d = v.data
  if (!d.showWhatsapp && !d.email) {
    return NextResponse.json({ error: "Informe ao menos um contato: WhatsApp ou e-mail." }, { status: 400 })
  }
  const maxOrder = await db.vaga.aggregate({ where: { businessId: business.id }, _max: { order: true } })

  const vaga = await db.vaga.create({
    data: {
      businessId: business.id,
      title: d.title,
      description: d.description,
      type: d.type || null,
      email: d.email || null,
      showWhatsapp: d.showWhatsapp,
      active: d.active,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  return NextResponse.json({ vaga })
}
