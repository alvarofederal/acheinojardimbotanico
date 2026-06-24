export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { validateHandle, normalizeHandle } from "@/lib/handle"
import { slugify } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const urlOrEmpty = z.string().url().or(z.literal("")).optional()

/** "YYYY-MM-DD" → fim do dia em São Paulo (instante absoluto); vazio/ inválido → null. */
function endOfDaySP(ymd?: string): Date | null {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null
  return new Date(`${ymd}T23:59:59-03:00`)
}
const timePoint = z.object({
  day: z.number().int().min(0).max(6),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
})

const schema = z.object({
  description: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  website: urlOrEmpty,
  instagram: z.string().max(60).optional(),
  facebook: urlOrEmpty,
  linkedin: urlOrEmpty,
  youtube: urlOrEmpty,
  ifood: urlOrEmpty,
  offerActive: z.boolean().optional(),
  offerTitle: z.string().max(80).optional(),
  offerText: z.string().max(280).optional(),
  offerDeadline: z.string().optional(), // "YYYY-MM-DD" ou "" pra limpar
  storeWhatsappMessage: z.string().max(400).optional(),
  storeCoverUrl: urlOrEmpty,
  storeCoverPos: z.string().max(20).optional(),
  storeTagline: z.string().max(140).optional(),
  handle: z.string().max(40).optional(),
  openingHours: z.object({
    periods: z.array(z.object({ open: timePoint, close: timePoint })).max(50),
    feriadoFechado: z.boolean().optional(),
  }).optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const business = await db.business.findFirst({ where: { ownerId: session.user.id }, include: { category: true } })
  if (!business) return NextResponse.json({ error: "Nenhum negócio vinculado" }, { status: 404 })

  const data = v.data

  // Handle (slug curto) — perk de plano pago, único e em formato válido
  let handleUpdate: string | null | undefined = undefined
  if (data.handle !== undefined) {
    const raw = data.handle.trim()
    if (raw === "") {
      handleUpdate = null // limpar
    } else {
      const err = validateHandle(raw)
      if (err) return NextResponse.json({ error: err }, { status: 400 })
      const norm = normalizeHandle(raw)
      const taken = await db.business.findUnique({ where: { handle: norm }, select: { id: true } })
      if (taken && taken.id !== business.id) {
        return NextResponse.json({ error: "Esse link já está em uso. Tente outro." }, { status: 409 })
      }
      handleUpdate = norm
    }
  }
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
      ifood: data.ifood !== undefined ? (data.ifood || null) : business.ifood, // permite limpar
      offerActive: data.offerActive !== undefined ? data.offerActive : business.offerActive,
      offerTitle: data.offerTitle !== undefined ? (data.offerTitle.trim() || null) : business.offerTitle,
      offerText: data.offerText !== undefined ? (data.offerText.trim() || null) : business.offerText,
      offerDeadline: data.offerDeadline !== undefined ? endOfDaySP(data.offerDeadline) : business.offerDeadline,

      storeWhatsappMessage: data.storeWhatsappMessage ?? business.storeWhatsappMessage,
      storeCoverUrl: data.storeCoverUrl !== undefined ? (data.storeCoverUrl || null) : business.storeCoverUrl,
      storeCoverPos: data.storeCoverPos !== undefined ? (data.storeCoverPos || null) : business.storeCoverPos,
      storeTagline: data.storeTagline !== undefined ? (data.storeTagline || null) : business.storeTagline,
      ...(handleUpdate !== undefined ? { handle: handleUpdate } : {}),
      ...(data.openingHours !== undefined ? { openingHours: data.openingHours } : {}),
    },
  })

  // Revalida o perfil público (ISR) pra a edição aparecer NA HORA, não em ~1h.
  const longBase = `/${slugify(business.neighborhood)}/${business.category.slug}/${business.slug}`
  revalidatePath(longBase)
  revalidatePath(`${longBase}/loja`)
  for (const h of [business.handle, handleUpdate].filter(Boolean) as string[]) {
    revalidatePath(`/${h}`)
    revalidatePath(`/${h}/loja`)
  }

  return NextResponse.json({ ok: true })
}
