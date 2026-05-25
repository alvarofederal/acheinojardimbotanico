import Link from "next/link"
import { ArrowLeft, MapPinOff } from "lucide-react"
import { MonsteraLeaf, FernFrond } from "@/app/(public)/_components/botanicals"

export default function NotFound() {
  return (
    <main className="min-h-screen flora-bg flex flex-col items-center justify-center px-4 py-10 text-center relative overflow-hidden">
      {/* Botânica de fundo */}
      <MonsteraLeaf className="absolute -left-16 -top-10 w-64 h-64 text-flora-green/10 dark:text-flora-fresh/10 flora-wind" />
      <FernFrond className="absolute right-[6%] -bottom-10 w-24 h-64 text-flora-soft/20 flora-wind hidden sm:block" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 flex flex-col items-center">
        <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-flora-green/10 dark:bg-flora-fresh/15 mb-6">
          <MapPinOff className="w-8 h-8 text-flora-green dark:text-flora-fresh" strokeWidth={1.8} />
        </span>

        <p className="font-serif text-6xl font-semibold flora-ink leading-none">404</p>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold flora-ink mt-3">
          Página não <span className="italic text-flora-green dark:text-flora-fresh">encontrada</span>
        </h1>
        <p className="flora-muted mt-3 mb-8 max-w-sm text-sm leading-relaxed">
          O endereço que você procurou não existe ou o negócio pode ter saído do guia. 🌿
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-flora-green hover:bg-flora-fresh text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-flora-green/25 hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
      </div>
    </main>
  )
}
