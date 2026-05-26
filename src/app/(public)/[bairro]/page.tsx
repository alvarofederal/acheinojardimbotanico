import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ bairro: string }>
}

/**
 * Resolve o "handle" (slug curto/vanity): /arte-e-tradicao → redireciona para o
 * perfil canônico /jardim-botanico/<categoria>/<slug>. Compartilha o segmento
 * [bairro] (não pode haver outro nome de dynamic no mesmo nível).
 */
export default async function HandleResolverPage({ params }: PageProps) {
  const { bairro } = await params

  const business = await db.business.findUnique({
    where: { handle: bairro.toLowerCase() },
    select: { slug: true, neighborhood: true, status: true, category: { select: { slug: true } } },
  })

  if (!business || business.status === "SUSPENDED") notFound()

  redirect(`/${slugify(business.neighborhood)}/${business.category.slug}/${business.slug}`)
}
