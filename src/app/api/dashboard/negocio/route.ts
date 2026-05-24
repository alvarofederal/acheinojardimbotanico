export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { z } from "zod"

const urlOrEmpty = z.string().url().or(z.literal("")).optional()

const schema = z.object({
  description: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  website: urlOrEmpty,
  instagram: z.string().max(60).optional(),
  facebook: urlOrEmpty,
  linkedin: urlOrEmpty,
  youtube: urlOrEmpty,
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ error: "Nenhum negócio vinculado" }, { status: 404 })

  const data = v.data
  await db.business.update({
    where: { id: business.id },
    data: {
      description: data.description ?? business.description,
      phone: data.phone || business.phone,
      whatsapp: data.whatsapp || business.whatsapp,
      website: data.website || business.website,
      instagram: data.instagram || business.instagram,
      facebook: data.facebook || business.facebook,
      linkedin: data.linkedin || business.linkedin,
      youtube: data.youtube || business.youtube,
    },
  })

  return NextResponse.json({ ok: true })
}
