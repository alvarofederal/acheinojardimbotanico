# ADR 0001 — Stack tecnológica

- **Status:** Aceito
- **Data:** 2026-05-21
- **Decisores:** Álvaro

## Contexto

Precisamos de uma stack para o Achei no Jardim Botânico que: (1) priorize SEO local
(a descoberta orgânica é o motor de aquisição da persona Marina), (2) permita a um
desenvolvedor solo entregar rápido em janelas curtas (1h/dia), (3) tenha custo baixo
no início e (4) reaproveite o conhecimento e a base de código do Courtesyfy.

## Decisão

**Next.js 15 (App Router) + TypeScript + Tailwind + Prisma + MySQL, deploy na Vercel.**

- App Router com Server Components → SSR/ISR nativo, essencial para SEO.
- ISR (revalidação 1h) nas páginas públicas → HTML estático para o Google, dados frescos.
- Prisma + MySQL (Hostinger, `relationMode = "prisma"`) → já contratado, sem custo extra.
- Vercel → deploy trivial, edge cache, preview por PR.

## Alternativas consideradas

- **Astro / Remix:** ótimos para conteúdo, mas perderíamos o reaproveitamento do
  Courtesyfy (auth, dashboard, componentes) e o ecossistema NextAuth.
- **Postgres (Supabase/Neon):** tecnicamente superior, mas o MySQL do Hostinger já
  está pago e o volume do MVP não justifica migração.
- **WordPress:** rápido de publicar, mas teto baixo para o painel de anunciante e
  integrações (Places, Asaas).

## Consequências

- (+) Reaproveitamento direto do Courtesyfy; SEO de primeira classe via ISR.
- (+) Um único repo, uma única linguagem (TS) ponta a ponta.
- (−) `relationMode = "prisma"` exige índices manuais nas FKs (sem constraints no banco).
- (−) Acoplamento à Vercel para o melhor DX (mitigável: `output: standalone`).
