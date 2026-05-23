import Link from "next/link"
import { MapPinOff } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-white dark:bg-[#050505]">
      <MapPinOff className="w-14 h-14 text-emerald-500 mb-5" />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Página não encontrada</h1>
      <p className="text-gray-500 dark:text-white/50 mb-8 max-w-sm">
        O endereço que você procurou não existe ou o negócio pode ter saído do guia.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
      >
        Voltar ao início
      </Link>
    </main>
  )
}
