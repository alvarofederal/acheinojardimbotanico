import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { EventManager, type EventItem } from "./_components/event-manager"
import { Store } from "lucide-react"

export default async function EventosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({ where: { ownerId: session.user.id } })

  if (!business) return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold dash-title">Meus Eventos</h1>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
        <Store className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
        <h2 className="font-semibold dash-title mb-1">Nenhum negócio vinculado</h2>
        <p className="text-sm dash-subtitle mb-4">Reivindique seu negócio para criar eventos.</p>
        <Link href="/" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">Buscar meu negócio</Link>
      </div>
    </div>
  )

  const events = await db.event.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" } })
  const items: EventItem[] = events.map(e => ({
    id: e.id, title: e.title, excerpt: e.excerpt, content: e.content, coverUrl: e.coverUrl,
    status: e.status, eventDate: e.eventDate ? e.eventDate.toISOString() : "",
    eventLocation: e.eventLocation, eventUrl: e.eventUrl, moderationNote: e.moderationNote,
  }))

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Meus Eventos</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Divulgue eventos do seu negócio na agenda do bairro — {business.name}</p>
      </div>
      <EventManager events={items} />
    </div>
  )
}
