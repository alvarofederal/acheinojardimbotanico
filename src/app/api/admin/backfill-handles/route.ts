import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { generateHandle } from "@/lib/handle"

/**
 * POST /api/admin/backfill-handles
 * Preenche o `handle` (URL curta) de TODOS os negócios que ainda não têm.
 * Idempotente: pode rodar quantas vezes quiser — só completa o que falta.
 * Não toca em quem já tem handle. Colisão tratada (sufixo -2, -3…).
 */
export async function POST() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const all = await db.business.findMany({ select: { id: true, name: true, slug: true, handle: true } })

  // Reserva tudo que já está em uso (handles + slugs) pra não colidir
  const taken = new Set<string>()
  for (const b of all) {
    if (b.handle) taken.add(b.handle)
    if (b.slug) taken.add(b.slug)
  }

  const semHandle = all.filter(b => !b.handle)
  let preenchidos = 0
  for (const b of semHandle) {
    const h = generateHandle(b.name, c => taken.has(c))
    taken.add(h)
    await db.business.update({ where: { id: b.id }, data: { handle: h } })
    preenchidos++
  }

  return NextResponse.json({
    ok: true,
    total: all.length,
    jaTinham: all.length - semHandle.length,
    preenchidos,
  })
}
