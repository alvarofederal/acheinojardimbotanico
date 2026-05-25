import { Suspense } from "react"
import { ResetForm } from "./_components/reset-form"
import { AuthShell } from "@/components/auth-shell"

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams

  return (
    <AuthShell subtitle="Defina uma nova senha">
      <Suspense>
        <ResetForm token={token ?? ""} />
      </Suspense>
    </AuthShell>
  )
}
