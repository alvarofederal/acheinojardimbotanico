export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { sendClaimReceivedEmail } from "@/lib/email"
import { z } from "zod"

const schema = z.object({
  businessId: z.string().min(1),
  message: z.string().min(10, "Descreva como verificar que o negócio é seu (mín. 10 caracteres)"),
  cnpj: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const { businessId, message, cnpj } = v.data

  const business = await db.business.findUnique({ where: { id: businessId } })
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })
  if (business.ownerId) return NextResponse.json({ error: "Este negócio já foi reivindicado" }, { status: 409 })

  // Verifica se já tem claim pendente deste usuário
  const existing = await db.claimRequest.findFirst({
    where: { businessId, userId: session.user.id, status: "PENDING" },
  })
  if (existing) return NextResponse.json({ error: "Você já tem uma solicitação pendente para este negócio" }, { status: 409 })

  await db.claimRequest.create({
    data: {
      businessId,
      userId: session.user.id,
      message: cnpj ? `CNPJ: ${cnpj}\n\n${message}` : message,
      status: "PENDING",
    },
  })

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "claim.created",
      entity: "ClaimRequest",
      entityId: businessId,
      businessId,
      metadata: { businessName: business.name },
    },
  })

  // Notifica admins (não bloqueia a resposta em caso de falha)
  try {
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    })
    await Promise.all(
      admins
        .filter(a => a.email)
        .map(a =>
          sendClaimReceivedEmail(
            a.email!,
            business.name,
            session.user.name ?? "Usuário",
            session.user.email ?? ""
          )
        )
    )
  } catch (e) {
    console.error("Falha ao notificar admins:", e)
  }

  return NextResponse.json({ ok: true })
}
