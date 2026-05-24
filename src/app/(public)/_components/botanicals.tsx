/**
 * Ilustrações botânicas em SVG — Flora Design System.
 * Folhas realistas (nervuras, recortes orgânicos) para compor o hero e
 * estados vazios sem depender de fotografia. Aceitam className/style.
 */

/** Folha de monstera realista com fenestrações e nervuras. */
export function MonsteraLeaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 240 260" fill="none" className={className} style={style} aria-hidden>
      {/* contorno da folha com recortes (fenestrações da borda) */}
      <path
        d="M120 250
           C118 200 118 150 120 120
           C70 118 36 92 30 120
           C24 96 40 60 70 56
           C66 30 86 14 120 10
           C154 14 174 30 170 56
           C200 60 216 96 210 120
           C204 92 170 118 120 120
           C122 150 122 200 120 250 Z"
        fill="currentColor"
      />
      <path
        d="M120 12C92 30 72 44 60 70c14-6 30-8 46-6-2 18-2 38 0 56-22 2-44-6-58-22 4 28 26 50 54 56
           -2 24-2 48 0 70 18-2 18-2 24-2-2-22-2-46 0-68 28-6 50-28 54-56-14 16-36 24-58 22 2-18 2-38 0-56 16-2 32 0 46 6-12-26-32-40-60-58Z"
        fill="rgba(0,0,0,0.08)"
      />
      {/* nervuras */}
      <g stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M120 22v220" />
        <path d="M120 64C100 62 78 54 64 70" />
        <path d="M120 64c20-2 42-10 56 6" />
        <path d="M120 120C96 118 70 108 52 90" />
        <path d="M120 120c24-2 50-12 68-30" />
        <path d="M120 178c-18 0-36-8-48-22" />
        <path d="M120 178c18 0 36-8 48-22" />
      </g>
    </svg>
  )
}

/** Folha lanceolada realista (uma folha, com nervuras finas). */
export function SimpleLeaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 160" fill="none" className={className} style={style} aria-hidden>
      <path
        d="M50 156C20 120 8 80 18 44 24 22 36 8 50 2c14 6 26 20 32 42 10 36-2 76-32 112Z"
        fill="currentColor"
      />
      <g stroke="rgba(255,255,255,0.30)" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M50 8v140" />
        {[126, 104, 82, 60, 40].map((y, i) => (
          <g key={y}>
            <path d={`M50 ${y}c-${14 - i * 1.5} -2 -${24 - i * 2} -10 -${30 - i * 2} -22`} />
            <path d={`M50 ${y}c${14 - i * 1.5} -2 ${24 - i * 2} -10 ${30 - i * 2} -22`} />
          </g>
        ))}
      </g>
    </svg>
  )
}

/** Ramo com folhas alternadas (realista, com nervura central). */
export function LeafSprig({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const leaves = [205, 170, 135, 100, 66]
  return (
    <svg viewBox="0 0 180 250" fill="none" className={className} style={style} aria-hidden>
      <path d="M86 248C86 188 84 128 100 56c3-14 8-26 18-36" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {leaves.map((y, i) => {
        const dir = i % 2 === 0 ? 1 : -1
        const tx = 86 + dir * 2
        return (
          <g key={y}>
            {/* folha preenchida */}
            <path
              d={`M${tx} ${y}
                  c${dir * 30} -2 ${dir * 54} -16 ${dir * 62} -40
                  c${dir * -26} -2 ${dir * -50} 10 ${dir * -62} 40 Z`}
              fill="currentColor" fillOpacity="0.85"
            />
            {/* nervura da folha */}
            <path d={`M${tx} ${y}c${dir * 30} -10 ${dir * 50} -22 ${dir * 58} -38`} stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        )
      })}
    </svg>
  )
}

/** Fronde de samambaia (delicada, folíolos curvos). */
export function FernFrond({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 130 270" fill="none" className={className} style={style} aria-hidden>
      <path d="M65 266C65 200 60 128 76 44c3-14 8-24 16-32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <g fill="currentColor">
        {Array.from({ length: 11 }).map((_, i) => {
          const y = 250 - i * 21
          const len = 16 + i * 2.4
          const op = 0.9 - i * 0.05
          return (
            <g key={i} opacity={op}>
              <path d={`M65 ${y}q-${len} 2 -${len + 6} -${len} q${len * 0.6} ${len * 0.5} ${len + 6} ${len} Z`} />
              <path d={`M65 ${y}q${len} 2 ${len + 6} -${len} q-${len * 0.6} ${len * 0.5} -${len + 6} ${len} Z`} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
