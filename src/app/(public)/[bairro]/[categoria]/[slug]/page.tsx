import { Suspense } from "react"
import { notFound, permanentRedirect } from "next/navigation"
import type { Metadata } from "next"
import { profilePath } from "@/lib/links"
import { loadProfile, buildProfileMetadata, ProfileView } from "./_components/profile-view"
import { DetailSkeleton } from "../../../_components/skeletons"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ bairro: string; categoria: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const business = await loadProfile({ slug })
  if (!business) return {}
  return buildProfileMetadata(business)
}

/**
 * URL longa /{bairro}/{categoria}/{slug}. Desde a virada de URL (2026-06), o
 * endereço real do perfil é a URL curta /{handle}. Aqui, quando o negócio tem
 * handle, redirecionamos 308 (permanente) pra curta — consolida SEO e não quebra
 * link antigo. Sem handle (transição), renderiza o perfil aqui mesmo.
 */
export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params
  const business = await loadProfile({ slug })
  if (!business || business.status === "SUSPENDED") notFound()
  if (business.handle) permanentRedirect(profilePath(business))
  // Suspense aqui (e não loading.tsx) preserva o 308 acima: o redirect é lançado
  // antes deste JSX; o skeleton só cobre o render do perfil (sem handle).
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProfileView business={business} />
    </Suspense>
  )
}
