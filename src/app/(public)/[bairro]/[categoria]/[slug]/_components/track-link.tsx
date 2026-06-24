"use client"

/**
 * Link externo do perfil que CONTA o clique (canal: iFood, Oferta) antes de abrir.
 * Renderiza um <a> real (abre em nova aba, middle-click funciona); o tracking é
 * fire-and-forget com keepalive, então completa mesmo saindo da aba.
 */
export function TrackLink({
  businessId, kind, href, className, children,
}: {
  businessId: string
  kind: "ifood" | "oferta"
  href: string
  className?: string
  children: React.ReactNode
}) {
  function track() {
    try {
      fetch("/api/track/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, kind }),
        keepalive: true,
      }).catch(() => {})
    } catch { /* nunca bloquear a navegação */ }
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={track} className={className}>
      {children}
    </a>
  )
}
