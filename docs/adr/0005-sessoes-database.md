# ADR 0005 — Sessões em banco (database strategy)

- **Status:** Aceito
- **Data:** 2026-05-21
- **Decisores:** Álvaro

## Contexto

NextAuth v5 suporta dois modos de sessão: JWT (stateless, no cookie) e database
(stateful, tabela `Session`). Precisamos decidir o modelo, considerando que o role do
usuário (`VISITOR`/`ADVERTISER`/`ADMIN`) muda em runtime — por exemplo, ao ter uma
reivindicação aprovada o usuário vira `ADVERTISER`.

## Decisão

**Sessões em banco (`strategy: "database"`), via PrismaAdapter.**

- O role é lido do banco no callback `session`, sempre fresco.
- Revogação imediata: ao redefinir senha ou excluir conta, apagamos as `Session` do usuário.
- `maxAge` 30 dias, `updateAge` 24h.

## Alternativas consideradas

- **JWT:** mais escalável e sem hit no banco, mas o role ficaria "preso" no token até
  expirar — um usuário recém-promovido a `ADVERTISER` só veria a mudança no próximo login,
  e a revogação seria difícil.

## Consequências

- (+) Role sempre atualizado; revogação de sessão trivial.
- (+) Coerente com aprovação de claim que altera o role na hora.
- (−) Cada request autenticado consulta o banco (aceitável no volume do MVP).
