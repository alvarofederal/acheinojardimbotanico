# ADR 0002 — Reaproveitar a base do Courtesyfy

- **Status:** Aceito
- **Data:** 2026-05-21
- **Decisores:** Álvaro

## Contexto

O Courtesyfy é um projeto Next.js anterior do mesmo autor, com autenticação completa
(NextAuth v5 + email/senha + OAuth + verificação de email), painel/dashboard com tema
dark, componentes shadcn/ui e integração Cloudinary já funcionando. Começar o Achei do
zero descartaria semanas de trabalho já validado.

## Decisão

**Partir da base do Courtesyfy, removendo toda a lógica de negócio específica
(cortesias, cupons, chaves, totem, Stripe) e mantendo a infraestrutura genérica.**

Foi criada uma branch `template/base` totalmente genérica (sem domínio) para servir de
ponto de partida para projetos futuros, evitando repetir a limpeza manual.

## Alternativas consideradas

- **Começar do zero:** mais limpo, porém lento — reescreveria auth, dashboard e upload.
- **Manter tudo do Courtesyfy e adaptar:** carregaria código morto e conceitos errados
  (chaves, resgates) que confundiriam o desenvolvimento do Achei.

## Consequências

- (+) Auth, dashboard, tema e upload prontos no dia 1.
- (+) Branch `template/base` reutilizável para os próximos projetos.
- (−) Risco de resíduos do Courtesyfy (branding, rotas, env) — mitigado com varreduras
  por grep e limpeza incremental conforme encontrados.
