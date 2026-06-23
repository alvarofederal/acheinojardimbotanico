import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { loadProfile, buildProfileMetadata, ProfileView } from "./[categoria]/[slug]/_components/profile-view"
import { DetailSkeleton } from "../_components/skeletons"

export const revalidate = 3600

interface PageProps {
  params: Promise<{ bairro: string }>
}

/**
 * URL curta /{handle} — o ENDEREÇO REAL do perfil (renderizado no lugar, sem
 * redirect). Compartilha o segmento [bairro]; como não há página de bairro
 * standalone, todo /{x} de um único segmento é um handle de negócio.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bairro } = await params
  const business = await loadProfile({ handle: bairro.toLowerCase() })
  if (!business) return {}
  return buildProfileMetadata(business)
}

export default async function HandleProfilePage({ params }: PageProps) {
  const { bairro } = await params
  const business = await loadProfile({ handle: bairro.toLowerCase() })
  if (!business || business.status === "SUSPENDED") notFound()
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProfileView business={business} />
    </Suspense>
  )
}
