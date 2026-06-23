import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { lojaPath } from "@/lib/links"
import { getPlanConfig } from "@/lib/plan-config"
import { type PlanId } from "@/lib/plans"
import { loadStore, buildStoreMetadata, StoreView } from "./_components/store-view"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ bairro: string; categoria: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const business = await loadStore({ slug })
  if (!business) return {}
  return buildStoreMetadata(business)
}

/**
 * URL longa da loja. Com handle → 308 pra /{handle}/loja (endereço real).
 * Sem handle (transição) → renderiza aqui; plano sem "loja" = 404.
 */
export default async function StorePage({ params }: PageProps) {
  const { slug } = await params
  const business = await loadStore({ slug })
  if (!business || business.status === "SUSPENDED") notFound()
  if (business.handle) permanentRedirect(lojaPath(business))
  const planCfg = await getPlanConfig(business.plan as PlanId)
  if (!planCfg.features.loja) notFound()
  return <StoreView business={business} />
}
