import { db } from "@/lib/prisma"
import { businessOgImage, ogSize } from "@/lib/og-business"

export const runtime = "nodejs"
export const size = ogSize
export const contentType = "image/png"
export const alt = "Achei no Jardim Botânico"

interface Props {
  params: Promise<{ bairro: string }>
}

/** OG da URL curta /{handle} — busca o negócio pelo handle. */
export default async function Image({ params }: Props) {
  const { bairro } = await params
  const business = await db.business.findUnique({
    where: { handle: bairro.toLowerCase() },
    select: { name: true, neighborhood: true, googleRating: true, category: { select: { name: true } } },
  })
  return businessOgImage(business)
}
