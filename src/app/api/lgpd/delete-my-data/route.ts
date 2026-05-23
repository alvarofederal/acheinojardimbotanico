/**
 * POST /api/lgpd/delete-my-data
 * Direito ao esquecimento (LGPD). Remove os dados pessoais do usuário.
 * Negócios importados do Google são dados públicos: o vínculo de posse é
 * desfeito (volta a IMPORTED), mas o registro do negócio permanece.
 */
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const userId = session.user.id

  await db.$transaction([
    // Desvincula negócios (mantém os dados públicos do Google)
    db.business.updateMany({
      where: { ownerId: userId },
      data: { ownerId: null, status: "IMPORTED", plan: "FREE", planExpiresAt: null },
    }),
    // Remove dados pessoais e de sessão
    db.claimRequest.deleteMany({ where: { userId } }),
    db.authToken.deleteMany({ where: { userId } }),
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    db.auditLog.create({
      data: {
        actorId: userId,
        action: "user.lgpd_delete",
        entity: "User",
        entityId: userId,
      },
    }),
    db.user.delete({ where: { id: userId } }),
  ])

  return NextResponse.json({ ok: true, message: "Seus dados foram removidos." })
}
