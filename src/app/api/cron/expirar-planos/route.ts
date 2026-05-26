export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { sendPlanExpiredEmail } from "@/lib/email"

/**
 * Cron diário: rebaixa para FREE todo negócio com plano pago cujo prazo venceu.
 * Sem isso, um pagante vencido continuaria com selo/destaque/loja no site público.
 *
 * Protegido por CRON_SECRET (o Vercel Cron envia `Authorization: Bearer <CRON_SECRET>`).
 * Idempotente: rodar duas vezes não causa efeito colateral.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
  }

  const now = new Date()

  const expired = await db.business.findMany({
    where: {
      plan: { in: ["VISIBILITY", "PREMIUM"] },
      planExpiresAt: { not: null, lt: now },
    },
    select: { id: true, name: true, plan: true, ownerId: true },
  })

  let downgraded = 0
  for (const b of expired) {
    await db.$transaction([
      db.business.update({ where: { id: b.id }, data: { plan: "FREE", planExpiresAt: null, planIsCourtesy: false } }),
      db.subscription.updateMany({
        where: { businessId: b.id, status: { not: "CANCELED" } },
        data: { status: "CANCELED", canceledAt: now },
      }),
      db.auditLog.create({
        data: {
          action: "PLAN_EXPIRED",
          entity: "Business",
          entityId: b.id,
          businessId: b.id,
          metadata: { from: b.plan, to: "FREE", at: now.toISOString() },
        },
      }),
    ])
    downgraded++

    // Notifica o dono (re-venda) — falha de email não derruba o cron
    if (b.ownerId) {
      try {
        const owner = await db.user.findUnique({ where: { id: b.ownerId }, select: { email: true } })
        if (owner?.email) await sendPlanExpiredEmail(owner.email, b.name, b.plan)
      } catch (e) { console.error("Falha ao notificar expiração:", e) }
    }
  }

  return NextResponse.json({ ok: true, checked: expired.length, downgraded })
}
