import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold mb-2">Achei no Jardim Botânico</h1>
      <p className="text-muted-foreground mb-8">
        Guia comercial digital hiperlocal do Jardim Botânico (DF)
      </p>
      <div className="flex gap-4">
        <Link href="/login"
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
          Entrar
        </Link>
        <Link href="/register"
          className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">
          Cadastrar negócio
        </Link>
      </div>
    </main>
  )
}
