"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Building2,
  Users,
  X,
  LogOut,
  Store,
  ShieldCheck,
  Download,
  ScrollText,
  UserCog,
  DollarSign,
  BarChart3,
  CreditCard,
  Tag,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { TopNavbar } from "./top-navbar"

const anuncianteNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard",           label: "Visão Geral",  icon: LayoutDashboard },
  { href: "/dashboard/metricas",  label: "Métricas",     icon: BarChart3       },
  { href: "/dashboard/negocio",   label: "Meu Negócio",  icon: Store           },
  { href: "/dashboard/produtos",  label: "Produtos",     icon: Tag             },
  { href: "/dashboard/plano",     label: "Meu Plano",    icon: ShieldCheck     },
  { href: "/dashboard/conta",     label: "Minha Conta",  icon: UserCog         },
]

const adminNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard",              label: "Visão Geral",  icon: LayoutDashboard },
  { href: "/dashboard/admin/negocios", label: "Negócios",   icon: Building2       },
  { href: "/dashboard/admin/import",   label: "Importar",   icon: Download        },
  { href: "/dashboard/admin/custos",   label: "Custos API", icon: DollarSign      },
  { href: "/dashboard/admin/pagamentos", label: "Pagamentos", icon: CreditCard    },
  { href: "/dashboard/admin/claims",   label: "Reivind.",   icon: ShieldCheck     },
  { href: "/dashboard/admin/usuarios", label: "Usuários",   icon: Users           },
  { href: "/dashboard/admin/audit",    label: "Auditoria",  icon: ScrollText      },
]

/* ─── Sidebar — sempre dark (identidade de marca) ──────────────── */

interface SidebarContentProps {
  navItems: typeof anuncianteNav
  initial: string
  displayName: string
  isAdmin: boolean
  isActive: (href: string) => boolean
  onClose?: () => void
}

function SidebarContent({ navItems, initial, displayName, isAdmin, isActive, onClose }: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-gray-200 dark:border-white/[0.07]">
        <Link href="/dashboard" onClick={onClose} className="logo-shine flex items-center">
          <span className="text-gray-900 dark:text-white font-extrabold text-lg tracking-tight select-none"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', sans-serif", letterSpacing: "-0.02em" }}>
            Achei<span className="logo-fy-pulse" style={{ color: "#10b981" }}> JBT</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-colors text-gray-400 dark:text-white/35 hover:text-gray-700 dark:hover:text-white"
            aria-label="Fechar menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User */}
      <div className="px-5 py-3.5 border-b border-gray-200 dark:border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.30)" }}>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">{initial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-gray-800 dark:text-white text-xs font-medium truncate">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-white/35">
              {isAdmin ? "Super Admin" : "Anunciante"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border ${
                active
                  ? "bg-emerald-50 dark:bg-emerald-500/[0.12] text-emerald-700 dark:text-white border-emerald-200 dark:border-emerald-500/20"
                  : "text-gray-600 dark:text-white/50 border-transparent hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                active
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-400 dark:text-white/30"
              }`} />
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-white/[0.07]">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full transition-all text-gray-500 dark:text-white/35 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white/75">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sair
        </button>
      </div>
    </>
  )
}

/* ─── AppShell ──────────────────────────────────────────────────── */

interface AppShellProps {
  role: string
  userName: string | null
  userEmail: string | null
  children: React.ReactNode
}

export function AppShell({ role, userName, userEmail, children }: AppShellProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [open])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const isAdmin     = role === "ADMIN"
  const navItems    = isAdmin ? adminNav : anuncianteNav
  const initial     = (userName ?? userEmail ?? "?")[0].toUpperCase()
  const displayName = userName ?? userEmail ?? "Usuário"

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
  }

  const sharedProps: SidebarContentProps = { navItems, initial, displayName, isAdmin, isActive }

  return (
    /* Wrapper principal — bg responsivo via CSS (dark/light) */
    <div className="flex h-screen overflow-hidden dash-bg">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 relative sidebar-panel border-r border-gray-200 dark:border-white/[0.07]">
        {/* Orb sutil */}
        <div aria-hidden className="absolute pointer-events-none"
          style={{
            top: "-40px", left: "-20px", width: "200px", height: "200px",
            background: "radial-gradient(ellipse, rgba(16,185,129,0.10), transparent 65%)",
            borderRadius: "50%",
          }} />
        <SidebarContent {...sharedProps} />
      </aside>

      {/* ── Mobile backdrop ── */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)} aria-hidden />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden transition-transform duration-300 ease-in-out sidebar-panel border-r border-gray-200 dark:border-white/[0.07] ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-modal role="dialog">
        <SidebarContent {...sharedProps} onClose={() => setOpen(false)} />
      </aside>

      {/* ── Área principal ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar userName={userName} userEmail={userEmail} role={role} onMenuClick={() => setOpen(true)} />

        {/* Grid overlay — visível no dark, quase invisível no light */}
        <div aria-hidden className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

        {/* Orb superior esmeralda */}
        <div aria-hidden className="fixed pointer-events-none z-0"
          style={{
            width: "600px", height: "400px",
            top: "-150px", left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(ellipse, rgba(16,185,129,0.08), transparent 65%)",
            borderRadius: "50%",
          }} />

        <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
