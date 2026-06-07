export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { cloudinary } from "@/lib/cloudinary"

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const OK_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]

/**
 * Sobe a logo (curada pelo admin) pro Cloudinary e salva em Business.logoUrl.
 * Guarda o ORIGINAL (sem transformação lossy) — recorte/qualidade ficam no
 * delivery (cartão/display), garantindo a melhor qualidade na impressão.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const business = await db.business.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!business) return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 })

  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 })
  if (!OK_TYPES.includes(file.type)) return NextResponse.json({ error: "Use PNG, JPG, WEBP ou SVG" }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Imagem maior que 5 MB" }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const dataUri = `data:${file.type};base64,${buf.toString("base64")}`

  const up = await cloudinary.uploader.upload(dataUri, {
    public_id: `logo_${id}`,
    folder: "achei/logos",
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  })

  await db.business.update({ where: { id }, data: { logoUrl: up.secure_url } })
  await logAudit({
    actorId: session.user.id, action: "business.logo_updated",
    entity: "Business", entityId: id, businessId: id, metadata: { name: business.name },
  })

  return NextResponse.json({ url: up.secure_url })
}

/** Remove a logo curada. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  await db.business.update({ where: { id }, data: { logoUrl: null } })
  await logAudit({
    actorId: session.user.id, action: "business.logo_removed",
    entity: "Business", entityId: id, businessId: id,
  })
  return NextResponse.json({ ok: true })
}
