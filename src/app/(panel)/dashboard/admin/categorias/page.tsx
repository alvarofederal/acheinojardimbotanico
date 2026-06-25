import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { ICON_KEYS } from "@/lib/category-icons"
import { CategoryManager } from "./_components/category-manager"

export default async function AdminCategoriasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const rows = await db.category.findMany({
    select: { id: true, slug: true, name: true, iconName: true, order: true, description: true, _count: { select: { businesses: true } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  })

  const categories = rows.map(c => ({
    id: c.id, slug: c.slug, name: c.name, iconName: c.iconName, order: c.order,
    description: c.description, count: c._count.businesses,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Categorias</h1>
        <p className="dash-subtitle mt-0.5 text-sm">{categories.length} categorias · a ordem aqui define a ordem na home</p>
      </div>
      <CategoryManager categories={categories} iconKeys={ICON_KEYS} />
    </div>
  )
}
