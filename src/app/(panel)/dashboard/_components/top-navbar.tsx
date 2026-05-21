"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { Settings, LogOut, Menu, ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface TopNavbarProps {
  userName: string | null
  userEmail: string | null
  role: string
  onMenuClick: () => void
}

export function TopNavbar({ userName, userEmail, role, onMenuClick }: TopNavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const isAdmin     = role === "ADMIN"
  const initial     = (userName ?? userEmail ?? "?")[0].toUpperCase()
  const displayName = userName ?? userEmail ?? "Usuário"

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <header className="h-14 dash-header flex items-center px-4 gap-3 flex-shrink-0 z-30">

      <button onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Abrir menu">
        <Menu className="w-5 h-5" />
      </button>

      <Link href="/dashboard" className="lg:hidden logo-shine flex items-center">
        <span className="text-gray-900 dark:text-white font-extrabold text-base tracking-tight">
          Achei<span style={{ color: "#10b981" }}> JBT</span>
        </span>
      </Link>

      <div className="flex-1" />

      <ThemeToggle />

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(v => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Perfil">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.30)" }}>
            <span className="text-emerald-500 dark:text-emerald-400 text-xs font-bold">{initial}</span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-white/80 max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-gray-400 dark:text-white/35" />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 dash-dropdown overflow-hidden z-50">
            <div className="px-4 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.30)" }}>
                  <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold">{initial}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold dash-title truncate">{displayName}</p>
                  {userEmail && <p className="text-xs dash-muted truncate">{userEmail}</p>}
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    isAdmin
                      ? "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400"
                      : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {isAdmin ? "Admin" : "Anunciante"}
                  </span>
                </div>
              </div>
            </div>
            <div className="py-1.5">
              <Link href="/dashboard/negocio" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm dash-subtitle hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Settings className="w-4 h-4 text-gray-400 dark:text-white/35" />
                Meu Negócio
              </Link>
            </div>
            <div className="border-t border-gray-100 dark:border-white/[0.06] py-1.5">
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full">
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
