export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db, Prisma } from "@/lib/prisma"
import { invalidatePlanConfigCache } from "@/lib/plan-config"
import { PLAN_FEATURE_KEYS } from "@/lib/plans"
import { z } from "zod"

const featuresSchema = z.object(
  Object.fromEntries(PLAN_FEATURE_KEYS.map(k => [k, z.boolean()])) as Record<string, z.ZodBoolean>
)

const planSchema = z.object({
  plan: z.enum(["FREE", "VISIBILITY", "PREMIUM"]),
  label: z.string().min(1).max(40),
  active: z.boolean(),
  priceCents: z.number().int().min(0).max(10_000_000),
  productLimit: z.number().int().min(0).max(1000),
  photoLimit: z.number().int().min(0).max(1000),
  vagaLimit: z.number().int().min(0).max(1000),
  features: featuresSchema,
  mercadoPagoLink: z.string().url().or(z.literal("")).optional(),
})

const paymentSchema = z.object({
  pixKey: z.string().max(200).optional(),
  pixHolderName: z.string().max(120).optional(),
  pixCopyPaste: z.string().max(2000).optional(),
  instructions: z.string().max(2000).optional(),
})

const schema = z.object({
  payment: paymentSchema,
  plans: z.array(planSchema).max(3),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const body = await req.json()
  const v = schema.safeParse(body)
  if (!v.success) return NextResponse.json({ error: v.error.errors[0].message }, { status: 400 })

  const p = v.data.payment
  const paymentData = {
    pixKey: p.pixKey || null,
    pixHolderName: p.pixHolderName || null,
    pixCopyPaste: p.pixCopyPaste || null,
    instructions: p.instructions || null,
  }

  await db.$transaction([
    db.paymentConfig.upsert({
      where: { id: "default" },
      create: { id: "default", ...paymentData },
      update: paymentData,
    }),
    ...v.data.plans.map(pl => {
      // Free é sempre ativo e grátis, independente do que vier
      const isFree = pl.plan === "FREE"
      const data = {
        label: pl.label,
        active: isFree ? true : pl.active,
        priceCents: isFree ? 0 : pl.priceCents,
        productLimit: pl.productLimit,
        photoLimit: pl.photoLimit,
        vagaLimit: pl.vagaLimit,
        features: pl.features as unknown as Prisma.InputJsonValue,
        mercadoPagoLink: isFree ? null : (pl.mercadoPagoLink?.trim() || null),
      }
      return db.planConfig.upsert({
        where: { plan: pl.plan },
        create: { plan: pl.plan, order: pl.plan === "FREE" ? 0 : pl.plan === "VISIBILITY" ? 1 : 2, ...data },
        update: data,
      })
    }),
  ])

  invalidatePlanConfigCache()
  // Reflete imediatamente nas páginas públicas (senão a /anuncie só atualiza em ~1h pelo ISR)
  revalidatePath("/anuncie")
  revalidatePath("/dashboard/plano")
  return NextResponse.json({ ok: true })
}
