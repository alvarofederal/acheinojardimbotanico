/**
 * Ilustrações botânicas em SVG — Flora Design System.
 * Line-art e silhuetas orgânicas para compor o hero e estados vazios,
 * sem depender de fotografia. Todas aceitam className para cor/opacidade.
 */

/** Folha de monstera estilizada (silhueta orgânica). */
export function MonsteraLeaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 220" fill="none" className={className} style={style} aria-hidden>
      <path
        d="M100 8C60 30 28 70 28 120c0 48 32 84 72 92 40-8 72-44 72-92 0-50-32-90-72-112Z"
        fill="currentColor" opacity="0.9"
      />
      <g stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round">
        <path d="M100 30v160" />
        <path d="M100 70C80 72 60 66 46 52" />
        <path d="M100 70c20 2 40-4 54-18" />
        <path d="M100 110C78 112 56 104 40 88" />
        <path d="M100 110c22 2 44-6 60-22" />
        <path d="M100 150c-20 2-38-6-50-20" />
        <path d="M100 150c20 2 38-6 50-20" />
      </g>
      {/* recortes característicos da monstera */}
      <path d="M100 56c-10 6-16 18-16 30 6-6 12-16 16-30Z" fill="rgba(0,0,0,0.10)" />
      <path d="M100 100c-12 4-20 16-22 30 8-8 16-18 22-30Z" fill="rgba(0,0,0,0.10)" />
    </svg>
  )
}

/** Ramo com folhas (line-art elegante). */
export function LeafSprig({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 160 240" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M80 236C80 180 80 120 92 60" />
        {[200, 168, 136, 104, 72].map((y, i) => {
          const dir = i % 2 === 0 ? 1 : -1
          return (
            <g key={y}>
              <path d={`M${80 + dir * 2} ${y}c${dir * 26} -6 ${dir * 44} -22 ${dir * 50} -44`} />
              <path
                d={`M${80 + dir * 2} ${y}c${dir * 30} 2 ${dir * 52} -10 ${dir * 60} -30 ${dir * -22} -2 ${dir * -44} 8 ${dir * -60} 30Z`}
                fill="currentColor" fillOpacity="0.18"
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

/** Fronde de samambaia (line-art delicado). */
export function FernFrond({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 260" fill="none" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M60 256C60 190 56 120 70 40c2-12 6-22 14-30" />
        {Array.from({ length: 9 }).map((_, i) => {
          const y = 240 - i * 24
          const len = 18 + i * 3
          return (
            <g key={i} opacity={0.9 - i * 0.04}>
              <path d={`M60 ${y}q-${len} -4 -${len + 8} -${len}`} />
              <path d={`M60 ${y}q${len} -4 ${len + 8} -${len}`} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

/** Folha simples preenchida (para micro-elementos e tags). */
export function SimpleLeaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden>
      <path d="M21 3C9 3 4 10 4 18c0 1 0 2 .3 3 6-9 12-12 16-13-4 3-8 7-11 14 9 0 15-6 15-16 0-1 0-2-.3-3Z" fill="currentColor" />
    </svg>
  )
}
