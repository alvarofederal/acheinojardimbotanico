import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { EventModeration, type ModItem } from "./_components/event-moderation"

export default async function AdminEventosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const events = await db.event.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } })

  const bizIds = [...new Set(events.map(e => e.businessId).filter(Boolean) as string[])]
  const businesses = await db.business.findMany({ where: { id: { in: bizIds } }, select: { id: true, name: true } })
  const bMap = new Map(businesses.map(b => [b.id, b.name]))

  const items: ModItem[] = events.map(e => ({
    id: e.id, slug: e.slug, title: e.title, excerpt: e.excerpt, coverUrl: e.coverUrl,
    eventDate: e.eventDate ? e.eventDate.toISOString() : null,
    eventLocation: e.eventLocation,
    businessName: e.businessId ? (bMap.get(e.businessId) ?? "—") : "—",
    createdAt: e.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Moderar Eventos</h1>
        <p className="dash-subtitle mt-0.5 text-sm">{items.length} aguardando análise</p>
      </div>
      <EventModeration events={items} />
    </div>
  )
}
