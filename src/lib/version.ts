/**
 * Versão da aplicação (SemVer) — fonte única: campo `version` do package.json.
 * Exposta no build via next.config.ts (env.NEXT_PUBLIC_APP_VERSION).
 * O fallback existe só para nunca renderizar vazio em dev/SSR.
 *
 * Como subir a versão (ver CLAUDE.md → "Versionamento & Release"):
 *   npm run patch        → correção / ajuste pequeno   (1.18.0 → 1.18.1)
 *   npm run end-sprint   → marco / feature relevante    (1.18.x → 1.19.0)
 *   npm run release      → grande marco / reescrita     (1.x    → 2.0.0)
 *
 * Histórico legível em CHANGELOG.md.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.18.0"
