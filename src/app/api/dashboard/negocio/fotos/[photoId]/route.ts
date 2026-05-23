export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { photoId } = await params

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ error: "Nenhum negócio vinculado" }, { status: 404 })

  const photo = await db.photo.findUnique({ where: { id: photoId } })
  if (!photo || photo.businessId !== business.id) {
    return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 })
  }

  // Só permite remover fotos enviadas pelo dono (não as do Google)
  if (photo.source !== "OWNER_UPLOAD") {
    return NextResponse.json({ error: "Esta foto não pode ser removida" }, { status: 403 })
  }

  await db.photo.delete({ where: { id: photoId } })
  return NextResponse.json({ ok: true })
}
