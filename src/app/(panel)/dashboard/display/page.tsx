import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/prisma"
import { buildDisplayData } from "@/lib/display"
import { DisplayCard } from "@/components/display-card"
import { Printer, QrCode, Store } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DisplayPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const business = await db.business.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true, name: true, handle: true, slug: true, neighborhood: true,
      category: { select: { name: true, slug: true } },
    },
  })

  if (!business) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold dash-title">Display da loja</h1>
          <p className="dash-subtitle mt-0.5 text-sm">Seu cartaz com QR Code para o balcão</p>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
          <Store className="w-10 h-10 text-gray-300 dark:text-white/20 mx-auto mb-3" />
          <p className="text-sm dash-subtitle">Reivindique seu negócio para gerar o display.</p>
        </div>
      </div>
    )
  }

  const data = buildDisplayData(business)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold dash-title">Display da loja</h1>
        <p className="dash-subtitle mt-0.5 text-sm">
          Imprima e coloque no balcão. Seus clientes escaneiam e acham você no guia.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-sm dash-subtitle space-y-1">
          <p className="font-medium dash-title">Como usar:</p>
          <p>1. Clique em <strong>Imprimir</strong> abaixo e escolha o tamanho <strong>A6</strong> (10×15cm).</p>
          <p>2. Para PDF, escolha <strong>&quot;Salvar como PDF&quot;</strong> no destino da impressão.</p>
          <p>3. Coloque num display de acrílico em pé, no balcão.</p>
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center gap-5">
        <div className="overflow-auto max-w-full rounded-xl shadow-lg" style={{ boxShadow: "0 10px 40px rgba(30,92,69,0.18)" }}>
          <DisplayCard data={data} />
        </div>

        <Link
          href={`/display-print/${business.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimir / Gerar PDF
        </Link>
      </div>
    </div>
  )
}
