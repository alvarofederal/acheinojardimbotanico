/**
 * Ilustrações botânicas em SVG — Flora Design System.
 * Folhas naturalistas com curvas suaves (formato ovado/amêndoa, ponta
 * alongada e nervuras) para compor o hero e estados vazios, sem fotografia.
 * Mantém os 4 nomes usados pelo restante do app.
 */

// Folha normalizada: base na origem (0,0), ponta para cima (0,-60).
const LEAF_PATH =
  "M0 0 C -12 -16 -15 -38 -5 -54 C -2.5 -58 0 -60 0 -60 C 0 -60 2.5 -58 5 -54 C 15 -38 12 -16 0 0 Z"
const MIDRIB_PATH = "M0 -5 C -1 -24 -0.5 -42 0 -55"
const VEIN_L = "M0 -16 C -4 -20 -7 -26 -9 -32"
const VEIN_R = "M0 -16 C 4 -20 7 -26 9 -32"
const VEIN_L2 = "M0 -30 C -3 -33 -5 -38 -6 -43"
const VEIN_R2 = "M0 -30 C 3 -33 5 -38 6 -43"

function Leaflet({ x, y, rot, scale, opacity = 1 }: { x: number; y: number; rot: number; scale: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      <path d={LEAF_PATH} fill="currentColor" />
      <g stroke="rgba(255,255,255,0.28)" strokeWidth={1.4 / scale} fill="none" strokeLinecap="round">
        <path d={MIDRIB_PATH} />
        <path d={VEIN_L} /><path d={VEIN_R} />
        <path d={VEIN_L2} /><path d={VEIN_R2} />
      </g>
    </g>
  )
}

/** Uma folha elegante isolada. */
export function SimpleLeaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="-22 -64 44 70" fill="none" className={className} style={style} aria-hidden>
      <Leaflet x={0} y={0} rot={0} scale={1} />
    </svg>
  )
}

/** Trio de folhas saindo de um ponto (cluster cheio para cantos do hero). */
export function MonsteraLeaf({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="-90 -130 180 150" fill="none" className={className} style={style} aria-hidden>
      {/* caules curtos */}
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.8">
        <path d="M0 18 C -8 0 -22 -14 -38 -26" />
        <path d="M0 18 C 0 -6 0 -30 0 -52" />
        <path d="M0 18 C 8 0 22 -14 38 -26" />
      </g>
      <Leaflet x={-38} y={-26} rot={-42} scale={1.35} opacity={0.92} />
      <Leaflet x={38} y={-26} rot={42} scale={1.35} opacity={0.92} />
      <Leaflet x={0} y={-52} rot={0} scale={1.7} />
    </svg>
  )
}

/** Ramo curvo com folhas alternadas — naturalista. */
export function LeafSprig({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const points = [
    { x: 66, y: 206, rot: -118, scale: 0.95 },
    { x: 70, y: 168, rot: 64, scale: 1.05 },
    { x: 78, y: 130, rot: -112, scale: 1.1 },
    { x: 88, y: 94, rot: 70, scale: 1.05 },
    { x: 100, y: 60, rot: -104, scale: 0.95 },
    { x: 112, y: 32, rot: 60, scale: 0.85 },
  ]
  return (
    <svg viewBox="0 0 180 230" fill="none" className={className} style={style} aria-hidden>
      <path d="M62 226 C 58 184 66 130 84 88 C 96 60 110 40 124 24"
        stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.85" />
      {points.map((p, i) => <Leaflet key={i} {...p} opacity={0.95 - i * 0.04} />)}
    </svg>
  )
}

/** Fronde de samambaia — folíolos curvos e afilados. */
export function FernFrond({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 130 260" fill="none" className={className} style={style} aria-hidden>
      <path d="M64 256 C 60 196 62 130 78 56 C 84 34 90 22 100 12"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <g fill="currentColor">
        {Array.from({ length: 13 }).map((_, i) => {
          const t = i / 12
          const y = 244 - t * 220
          const x = 64 + t * 30
          const len = 26 - t * 16
          const dir = i % 2 === 0 ? -1 : 1
          const rot = dir * (70 - t * 20)
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${len / 60})`} opacity={0.92 - t * 0.3}>
              <path d={LEAF_PATH} />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
