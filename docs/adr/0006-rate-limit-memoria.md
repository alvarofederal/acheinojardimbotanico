# ADR 0006 — Rate limiting em memória (sem Upstash)

- **Status:** Aceito
- **Data:** 2026-05-21
- **Decisores:** Álvaro

## Contexto

O Courtesyfy usava Upstash Redis para rate limiting distribuído nas rotas de auth.
No Achei, o volume do MVP é baixo e adicionar uma dependência externa (e custo/config)
para algo que ainda não precisa ser distribuído contraria o princípio de "dependência
mínima" da constituição.

## Decisão

**Rate limiting em memória (Map por processo), sem Upstash.**

- `checkRateLimit(identifier, maxAttempts, windowMs)` com store em memória.
- Aplicado em: login, registro, reenvio de verificação e forgot-password.

## Alternativas consideradas

- **Upstash Redis:** correto para múltiplas instâncias, mas é otimização prematura no
  estágio atual (uma instância serverless de baixa concorrência).

## Consequências

- (+) Zero dependências externas e zero custo.
- (+) Simples de entender e manter.
- (−) Não é compartilhado entre instâncias serverless — a proteção é por processo.
  Aceitável agora; quando o tráfego justificar, trocar a implementação por Redis sem
  mudar a assinatura da função.
