import { describe, it, expect } from "vitest"
import { buildPixPayload } from "@/lib/pix"

/**
 * O PIX copia-e-cola é dinheiro entrando: payload errado = cliente pagando
 * errado ou nada. Estes testes travam o formato EMV/BR Code.
 */
describe("buildPixPayload", () => {
  const base = { key: "atendimento@acheinojardimbotanico.com.br", name: "Achei JBT", city: "Brasília", amountCents: 4790 }

  it("gera payload EMV válido: começa em 000201 e termina com CRC de 4 hex", () => {
    const p = buildPixPayload(base)
    expect(p).toBeTruthy()
    expect(p!.startsWith("000201")).toBe(true)
    expect(p).toMatch(/6304[0-9A-F]{4}$/)
  })

  it("embute a chave PIX no campo do arranjo br.gov.bcb.pix", () => {
    const p = buildPixPayload(base)!
    expect(p).toContain("br.gov.bcb.pix")
    expect(p).toContain(base.key)
  })

  it("embute o VALOR exato com 2 casas (campo 54)", () => {
    const p = buildPixPayload(base)!
    expect(p).toContain("540547.90") // tlv: id 54, len 05, "47.90"
    const p2 = buildPixPayload({ ...base, amountCents: 9790 })!
    expect(p2).toContain("540597.90")
  })

  it("sanitiza nome/cidade: sem acento, maiúsculo, sem símbolos", () => {
    const p = buildPixPayload({ ...base, name: "Açaí & Café do João", city: "Brasília" })!
    expect(p).toContain("ACAI")
    expect(p).toContain("CAFE DO JOAO")
    expect(p).toContain("BRASILIA")
    expect(p).not.toMatch(/[áàâãéêíóôõúç&]/i)
  })

  it("é determinístico (mesmo input = mesmo payload/CRC)", () => {
    expect(buildPixPayload(base)).toBe(buildPixPayload(base))
  })

  it("recusa entradas inválidas (sem chave / valor zero ou negativo)", () => {
    expect(buildPixPayload({ ...base, key: "" })).toBeNull()
    expect(buildPixPayload({ ...base, amountCents: 0 })).toBeNull()
    expect(buildPixPayload({ ...base, amountCents: -100 })).toBeNull()
  })
})
