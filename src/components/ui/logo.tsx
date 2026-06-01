/**
 * Logo — Achei no Jardim Botânico
 * Identidade Flora: Playfair Display + Inter, paleta verde/dourado/areia.
 *
 * Variantes:
 *  - "full"  → marca + wordmark horizontal (header)
 *  - "icon"  → só a folha (favicon, avatar)
 *  - "stack" → folha + texto empilhado (posts, splash)
 */

interface LogoProps {
  variant?: "full" | "icon" | "stack"
  className?: string
}

export function Logo({ variant = "full", className = "" }: LogoProps) {
  if (variant === "icon") return <LogoIcon className={className} />
  if (variant === "stack") return <LogoStack className={className} />
  return <LogoFull className={className} />
}

/* ─────────────────────────── Leaf mark ─────────────────────────── */
function LeafMark({ scale = 1 }: { scale?: number }) {
  const w = 22 * scale
  const h = 50 * scale
  const cx = 11 * scale

  return (
    <g>
      {/* Folha principal */}
      <path
        d={`M${cx} 0 C${19*scale} ${1*scale},${22*scale} ${12*scale},${21*scale} ${21*scale} C${20*scale} ${31*scale},${17*scale} ${39*scale},${cx} ${44*scale} C${5*scale} ${39*scale},${2*scale} ${31*scale},${1*scale} ${21*scale} C${0*scale} ${12*scale},${3*scale} ${1*scale},${cx} 0Z`}
        fill="#1E5C45"
        className="dark:fill-[#3A8B6A]"
      />
      {/* Nervura central */}
      <line x1={cx} y1={2*scale} x2={cx} y2={42*scale}
        stroke="#A3C4B3" strokeWidth={0.9*scale} strokeLinecap="round" opacity="0.7" />
      {/* Nervuras laterais — par superior */}
      <line x1={cx} y1={11*scale} x2={18*scale} y2={7*scale}
        stroke="#A3C4B3" strokeWidth={0.7*scale} strokeLinecap="round" opacity="0.55" />
      <line x1={cx} y1={11*scale} x2={4*scale}  y2={7*scale}
        stroke="#A3C4B3" strokeWidth={0.7*scale} strokeLinecap="round" opacity="0.55" />
      {/* Nervuras laterais — par central */}
      <line x1={cx} y1={20*scale} x2={19*scale} y2={16*scale}
        stroke="#A3C4B3" strokeWidth={0.7*scale} strokeLinecap="round" opacity="0.5" />
      <line x1={cx} y1={20*scale} x2={3*scale}  y2={16*scale}
        stroke="#A3C4B3" strokeWidth={0.7*scale} strokeLinecap="round" opacity="0.5" />
      {/* Nervuras laterais — par inferior */}
      <line x1={cx} y1={30*scale} x2={18*scale} y2={27*scale}
        stroke="#A3C4B3" strokeWidth={0.65*scale} strokeLinecap="round" opacity="0.4" />
      <line x1={cx} y1={30*scale} x2={4*scale}  y2={27*scale}
        stroke="#A3C4B3" strokeWidth={0.65*scale} strokeLinecap="round" opacity="0.4" />
      {/* Caule */}
      <line x1={cx} y1={44*scale} x2={cx} y2={49*scale}
        stroke="#1E5C45" strokeWidth={1.5*scale} strokeLinecap="round"
        className="dark:stroke-[#3A8B6A]" />
      {/* Ponto dourado no ápice */}
      <circle cx={cx} cy={1.5*scale} r={1.8*scale} fill="#D2B48C" />
    </g>
  )
}

/* ──────────────────────── Full (horizontal) ───────────────────── */
function LogoFull({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 185 48"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-9 w-auto ${className}`}
      aria-label="Achei no Jardim Botânico"
      role="img"
    >
      <LeafMark />

      {/* "Achei" — Playfair Display Bold */}
      <text
        x="30" y="26"
        fontFamily="var(--font-playfair, 'Playfair Display', Georgia, serif)"
        fontSize="24" fontWeight="700" fontStyle="italic"
        fill="#1E5C45"
        className="dark:fill-[#F4F0E8]"
      >
        Achei
      </text>

      {/* Linha dourada separadora */}
      <line x1="30" y1="31" x2="182" y2="31"
        stroke="#D2B48C" strokeWidth="0.8" opacity="0.7" />

      {/* "no Jardim Botânico" — Inter */}
      <text
        x="30" y="42"
        fontFamily="var(--font-inter, Inter, system-ui, sans-serif)"
        fontSize="9.5" fontWeight="500"
        letterSpacing="2.2"
        fill="#D2B48C"
      >
        NO JARDIM BOTÂNICO
      </text>
    </svg>
  )
}

/* ─────────────────────────── Icon only ─────────────────────────── */
function LogoIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 22 50"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-8 w-auto ${className}`}
      aria-label="Achei no Jardim Botânico"
      role="img"
    >
      <LeafMark />
    </svg>
  )
}

/* ─────────────────────────── Stacked ───────────────────────────── */
function LogoStack({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 160 110"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-24 w-auto ${className}`}
      aria-label="Achei no Jardim Botânico"
      role="img"
    >
      {/* Folha centralizada */}
      <g transform="translate(69, 2)">
        <LeafMark scale={1} />
      </g>

      {/* "Achei" centralizado */}
      <text
        x="80" y="72"
        textAnchor="middle"
        fontFamily="var(--font-playfair, 'Playfair Display', Georgia, serif)"
        fontSize="28" fontWeight="700" fontStyle="italic"
        fill="#1E5C45"
        className="dark:fill-[#F4F0E8]"
      >
        Achei
      </text>

      {/* Linha dourada */}
      <line x1="20" y1="78" x2="140" y2="78"
        stroke="#D2B48C" strokeWidth="0.8" opacity="0.7" />

      {/* Subtítulo */}
      <text
        x="80" y="92"
        textAnchor="middle"
        fontFamily="var(--font-inter, Inter, system-ui, sans-serif)"
        fontSize="9" fontWeight="500"
        letterSpacing="2"
        fill="#D2B48C"
      >
        NO JARDIM BOTÂNICO
      </text>
    </svg>
  )
}
