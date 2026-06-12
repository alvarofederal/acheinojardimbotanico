import { describe, it, expect } from "vitest"
import { slugify } from "@/lib/utils"

/**
 * O slugify define URLs públicas (SEO) e os links curtos dos displays/cartões
 * impressos — slug errado = QR impresso apontando pro nada.
 */
describe("slugify", () => {
  it("remove acentos e baixa a caixa", () => {
    expect(slugify("Café com Açaí")).toBe("cafe-com-acai")
    expect(slugify("Jardim Botânico")).toBe("jardim-botanico")
  })

  it("troca espaços por hífen e colapsa repetições", () => {
    expect(slugify("  Pão   Dourado  ")).toBe("pao-dourado")
    expect(slugify("a - b -- c")).toBe("a-b-c")
  })

  it("descarta símbolos que quebrariam URL", () => {
    expect(slugify("Açaí & Cia (Mangueiral)!")).toBe("acai-cia-mangueiral")
  })

  it("aguenta entrada já limpa (idempotente)", () => {
    expect(slugify("quotidiano-barber-coffee")).toBe("quotidiano-barber-coffee")
  })
})
