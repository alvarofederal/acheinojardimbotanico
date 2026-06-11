/**
 * src/instrumentation.ts — roda UMA vez no boot do servidor (hook do Next).
 * Valida as variáveis de ambiente críticas e loga com clareza o que está
 * faltando/malformado — transforma "morreu sem log" em "morreu dizendo o porquê".
 */
export async function register() {
  const required = ["DATABASE_URL", "AUTH_SECRET"] as const
  const watched = ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"] as const

  const missing = required.filter(k => !process.env[k]?.trim())
  if (missing.length) {
    console.error(
      `\n🚨 [BOOT] VARIÁVEIS DE AMBIENTE FALTANDO: ${missing.join(", ")}` +
      `\n   O app NÃO funciona sem elas. Confira o painel de variáveis do host e reinicie.\n`
    )
  }

  for (const k of watched) {
    const v = process.env[k]
    if (!v) continue
    if (/^["']/.test(v) || /["']$/.test(v.trim()) || v.includes(`${k}=`)) {
      console.error(
        `⚠️ [BOOT] A variável ${k} parece MALFORMADA (aspas no valor ou "${k}=" duplicado). ` +
        `Corrija no painel: só o valor puro, sem aspas.`
      )
    }
  }

  if (!missing.length) {
    console.log(`✅ [BOOT] env ok (${required.join(", ")}) — v${process.env.NEXT_PUBLIC_APP_VERSION ?? "?"}`)
  }
}
