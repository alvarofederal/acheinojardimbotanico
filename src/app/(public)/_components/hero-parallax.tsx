"use client"

import { useEffect, useRef } from "react"
import { MonsteraLeaf, LeafSprig, FernFrond, SimpleLeaf } from "./botanicals"

/**
 * Camada de fundo do herói da home — folhas + brilhos com parallax de mouse e
 * scroll (sobre o drift CSS flora-wind/flutter, que fica no SVG interno, então
 * o transform do parallax e a animação de vento não conflitam). Decorativa.
 */
export function HeroParallax() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"))
    let mx = 0, my = 0, tx = 0, ty = 0, raf = 0
    const onMove = (e: MouseEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5 }
    window.addEventListener("mousemove", onMove, { passive: true })
    const loop = () => {
      tx += (mx - tx) * 0.06; ty += (my - ty) * 0.06
      const sc = window.scrollY
      for (const el of layers) {
        const d = parseFloat(el.dataset.depth || "0")
        el.style.transform = `translate3d(${(tx * d * 120).toFixed(1)}px, ${(ty * d * 120 + sc * d * 0.22).toFixed(1)}px, 0)`
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Brilhos */}
      <div data-depth="0.3" className="absolute will-change-transform" style={{ width: "520px", height: "520px", top: "-130px", left: "3%", borderRadius: "50%", filter: "blur(70px)", background: "radial-gradient(circle, rgba(46,139,87,.45), transparent 70%)" }} />
      <div data-depth="0.45" className="absolute will-change-transform" style={{ width: "600px", height: "600px", bottom: "-220px", right: "1%", borderRadius: "50%", filter: "blur(80px)", background: "radial-gradient(circle, rgba(210,180,140,.30), transparent 70%)" }} />
      {/* Folhas */}
      <div data-depth="0.6" className="absolute -left-16 -top-10 will-change-transform"><MonsteraLeaf className="w-72 h-72 text-flora-fresh/25 flora-wind" style={{ animationDuration: "8s" }} /></div>
      <div data-depth="0.95" className="absolute -right-20 top-24 will-change-transform"><MonsteraLeaf className="w-96 h-96 text-flora-green/30 flora-wind" style={{ animationDuration: "11s", animationDelay: "1.5s" }} /></div>
      <div data-depth="0.7" className="absolute right-[12%] -top-6 will-change-transform"><LeafSprig className="w-28 h-72 text-flora-soft/30 flora-wind" style={{ animationDelay: "0.8s", animationDuration: "7s" }} /></div>
      <div data-depth="0.5" className="absolute left-[8%] bottom-8 will-change-transform hidden sm:block"><FernFrond className="w-24 h-64 text-flora-soft/25 flora-wind" style={{ animationDelay: "2.5s", animationDuration: "9s" }} /></div>
      <div data-depth="1.15" className="absolute left-[30%] top-[18%] will-change-transform"><SimpleLeaf className="w-7 h-11 text-flora-gold/45 flora-flutter" style={{ animationDelay: "1.5s" }} /></div>
      <div data-depth="1.3" className="absolute right-[28%] bottom-[26%] will-change-transform"><SimpleLeaf className="w-6 h-9 text-flora-soft/45 flora-flutter" style={{ animationDelay: "3s" }} /></div>
    </div>
  )
}
