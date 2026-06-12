# Architecture Decision Records (ADRs)

Registros das decisões arquiteturais do Achei no Jardim Botânico. Cada ADR captura o
contexto, a decisão, as alternativas e as consequências de uma escolha relevante.

| # | Decisão | Status |
|---|---------|--------|
| [0001](0001-stack-tecnologica.md) | Stack tecnológica (Next.js 15 + Prisma + MySQL + Vercel) | Aceito |
| [0002](0002-base-courtesyfy.md) | Reaproveitar a base do Courtesyfy | Aceito |
| [0003](0003-google-places-import.md) | Importação via Google Places API (cold start) | Aceito |
| [0004](0004-pagamento-asaas.md) | Asaas como provedor de pagamento | Aceito |
| [0005](0005-sessoes-database.md) | Sessões em banco (database strategy) | Aceito |
| [0006](0006-rate-limit-memoria.md) | Rate limiting em memória (sem Upstash) | Aceito |
| [0007](0007-migracao-vps.md) | Migração shared → VPS Hostinger (Node+PM2+Caddy; MySQL fica no shared) | Aceito |

## Convenção

- Arquivos nomeados `NNNN-titulo-curto.md`, numeração sequencial.
- Status: `Proposto` → `Aceito` → (eventualmente) `Substituído por NNNN`.
- Uma decisão por arquivo. Mudou de ideia? Crie um novo ADR que substitui o anterior.
