import { Suspense } from "react"
import { VerifyEmailClient } from "./_components/verify-email-client"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; code?: string }>
}) {
  const params = await searchParams

  // Garante decode correto (ex: %40 → @) independente do Next.js versão
  const email = params.email ? decodeURIComponent(params.email) : undefined
  const code  = params.code  ? decodeURIComponent(params.code)  : undefined

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flora-bg flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-flora-green border-t-transparent rounded-full" />
        </div>
      }
    >
      <VerifyEmailClient email={email} code={code} />
    </Suspense>
  )
}
