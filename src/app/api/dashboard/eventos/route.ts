export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { sendEventSubmittedEmail } from "@/lib/email"
import { planHasFeature } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(3).max(160),
  excerpt: z.string().max(400).optional(),
  content: z.string().min(1),
  coverUrl: z.string().url().or(z.literal("")).optional(),
  eventDate: z.string().optional(),       // ISO
  eventLocation: z.string().max(200).optional(),
  eventUrl: z.string().url().or(z.literal("")).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ error: "Reivindique um negócio para criar eventos" }, { status: 404 })

  if (!(await planHasFeature(business.plan as PlanId, "eventos")))
    return NextResponse.json({ error: "Seu plano não inclui Eventos. Faça upgrade para divulgar eventos." }, { status: 403 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })
  const d = v.data

  const event = await db.event.create({
    data: {
      title: d.title,
      slug: `${slugify(d.title).slice(0, 60)}-${Math.random().toString(36).slice(2, 7)}`,
      excerpt: d.excerpt || null,
      content: d.content,
      coverUrl: d.coverUrl || null,
      eventDate: d.eventDate ? new Date(d.eventDate) : null,
      eventLocation: d.eventLocation || null,
      eventUrl: d.eventUrl || null,
      status: "PENDING",
      businessId: business.id,
      authorId: session.user.id,
    },
  })

  // Notifica admins para moderação
  try {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } })
    await Promise.all(admins.filter(a => a.email).map(a => sendEventSubmittedEmail(a.email!, business.name, d.title)))
  } catch (e) { console.error("Falha ao notificar admins do evento:", e) }

  return NextResponse.json({ event })
}
