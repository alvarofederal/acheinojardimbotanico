import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { CardPrintView } from "@/components/card-print-view"
import { ACHEI_CARD } from "@/lib/achei-card"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: { absolute: "cartao-achei-alvaro" } }

export default async function AcheiCardPrintPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")
  return <CardPrintView data={ACHEI_CARD} filename="cartao-achei-alvaro" />
}
