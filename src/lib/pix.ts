/**
 * src/lib/pix.ts
 * Gera o "PIX copia e cola" (BR Code / EMV) com o VALOR exato — para o QR do
 * checkout bater sempre com o total selecionado (plano × período).
 * Padrão: Manual do BR Code (Bacen) + CRC16-CCITT (0x1021, init 0xFFFF).
 */

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value
}

/** CRC16-CCITT (XModem) — 4 hex maiúsculos. Calculado sobre o payload + "6304". */
function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

/** Remove acentos/símbolos e limita o tamanho (nome ≤25, cidade ≤15). */
function sanitize(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max)
    .toUpperCase()
}

export interface PixInput {
  key: string
  name?: string | null
  city?: string | null
  amountCents: number
  txid?: string
}

/**
 * Monta a string do PIX copia-e-cola com o valor embutido.
 * Retorna null se não houver chave ou valor inválido.
 */
export function buildPixPayload({ key, name, city, amountCents, txid = "***" }: PixInput): string | null {
  if (!key || !amountCents || amountCents <= 0) return null

  const merchantName = sanitize(name || "RECEBEDOR", 25) || "RECEBEDOR"
  const merchantCity = sanitize(city || "BRASILIA", 15) || "BRASILIA"
  const amount = (amountCents / 100).toFixed(2)

  const mai = tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", key))
  const additional = tlv("62", tlv("05", txid))

  const payload =
    tlv("00", "01") +      // formato
    mai +                  // chave PIX
    tlv("52", "0000") +    // categoria
    tlv("53", "986") +     // moeda BRL
    tlv("54", amount) +    // valor
    tlv("58", "BR") +      // país
    tlv("59", merchantName) +
    tlv("60", merchantCity) +
    additional +
    "6304"                 // ID + tamanho do CRC

  return payload + crc16(payload)
}
