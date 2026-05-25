export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { sendClaimResultEmail } from "@/lib/email"
import { slugify, SITE_URL } from "@/lib/utils"
import { z } from "zod"

const schema = z.object({ action: z.enum(["approve", "reject"]) })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { claimId } = await params
  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: "Ação inválida" }, { status: 400 })

  const claim = await db.claimRequest.findUnique({
    where: { id: claimId },
    include: {
      business: { include: { category: { select: { slug: true } } } },
      user: { select: { email: true } },
    },
  })
  if (!claim) return NextResponse.json({ error: "Reivindicação não encontrada" }, { status: 404 })
  if (claim.status !== "PENDING") return NextResponse.json({ error: "Reivindicação já processada" }, { status: 409 })

  const { action } = v.data

  if (action === "approve") {
    await db.$transaction([
      db.claimRequest.update({
        where: { id: claimId },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewerId: session.user.id },
      }),
      db.business.update({
        where: { id: claim.businessId },
        data: { ownerId: claim.userId, status: "CLAIMED" },
      }),
      db.user.update({
        where: { id: claim.userId },
        data: { role: "ADVERTISER" },
      }),
    ])
  } else {
    await db.claimRequest.update({
      where: { id: claimId },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewerId: session.user.id },
    })
  }

  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      action: `claim.${action}d`,
      entity: "ClaimRequest",
      entityId: claimId,
      businessId: claim.businessId,
      metadata: { userId: claim.userId },
    },
  })

  // Notifica o usuário do resultado (não bloqueia a resposta)
  if (claim.user.email) {
    const businessUrl = `${SITE_URL}/${slugify(claim.business.neighborhood)}/${claim.business.category.slug}/${claim.business.slug}`
    try {
      await sendClaimResultEmail(
        claim.user.email,
        claim.business.name,
        action === "approve",
        action === "approve" ? businessUrl : undefined
      )
    } catch (e) {
      console.error("Falha ao notificar usuário:", e)
    }
  }

  return NextResponse.json({ ok: true })
}
