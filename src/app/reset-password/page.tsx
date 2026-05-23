import Link from "next/link"
import { Suspense } from "react"
import { ResetForm } from "./_components/reset-form"

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#050505" }}>
      <div
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          width: "600px", height: "600px", top: "-200px", left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 65%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="relative w-full max-w-md rounded-3xl p-8 z-10"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="text-center mb-8">
          <Link href="/">
            <span className="logo-shine font-bold tracking-tight select-none" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif", fontSize: "28px" }}>
              <span style={{ color: "#ffffff" }}>Achei no</span>
              <span className="logo-fy-pulse" style={{ color: "#10b981" }}> JBT</span>
            </span>
          </Link>
          <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.40)" }}>Defina uma nova senha</p>
        </div>
        <Suspense>
          <ResetForm token={token ?? ""} />
        </Suspense>
      </div>
    </div>
  )
}
