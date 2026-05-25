import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { NewsManager, type NewsItem } from "./_components/news-manager"

export default async function AdminNoticiasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const news = await db.news.findMany({ orderBy: [{ featured: "desc" }, { createdAt: "desc" }] })
  const items: NewsItem[] = news.map(n => ({
    id: n.id, title: n.title, slug: n.slug, excerpt: n.excerpt, content: n.content,
    coverUrl: n.coverUrl, status: n.status, featured: n.featured,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Notícias</h1>
        <p className="dash-subtitle mt-0.5 text-sm">Crie e publique notícias do bairro</p>
      </div>
      <NewsManager news={items} />
    </div>
  )
}
