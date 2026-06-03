# Runbook — Migração dev → produção

> Marco zero do lançamento: **1 de junho de 2026**. Prod limpo, dados de negócio copiados,
> métricas (views/cliques) começam do zero — base justa para o prêmio Achados.

## Estado atual (confirmado)

- `DATABASE_URL` → **prod** (`u937845481_ajb_prd_db`, vazio, sem schema)
- Dados de negócio intactos no **dev** (`u937845481_ajb_dev_db`)
- Mesmo host nos dois (`212.85.3.45:3306`)

## O que vai pro prod

| Copia | Não copia (começa zerado) |
|-------|---------------------------|
| Categorias, Negócios, Fotos, Produtos | Views, cliques, claims, sessões, tokens |
| Usuário admin + Arte e Tradição (com senha) | Demais usuários, pagamentos, presença |

Negócios sem dono mantido voltam a `IMPORTED` (sem dono).

---

## Passo a passo

### 0. Pré-requisito — variáveis no `.env`

Mantenha `DATABASE_URL` = **prod** e adicione as duas explícitas:

```
DATABASE_URL="<prod>"                # já está
SRC_DATABASE_URL="<dev>"             # origem da cópia
DST_DATABASE_URL="<prod>"            # destino da cópia (= DATABASE_URL)
```

> O script usa SRC/DST explícitos — não depende de `DATABASE_URL`. Aborta se SRC == DST.

### 1. Criar o schema no prod

```
node_modules/.bin/prisma db push
```
(Como `DATABASE_URL` = prod, cria todas as tabelas no banco de produção. Não-destrutivo.)

### 2. Simular a cópia (não grava)

```
npx tsx scripts/migrate-to-prod.ts
```
Confira o resumo: ORIGEM = dev, DESTINO = prod, contagens batem, os 2 usuários aparecem.

### 3. Executar a cópia

```
npx tsx scripts/migrate-to-prod.ts --confirm
```

### 4. Conferir o prod

```
node_modules/.bin/prisma studio
```
(ou um count rápido). Espere ~600 negócios, categorias, fotos, 2 usuários.

### 5. Go-live

- `DATABASE_URL` já está em prod localmente.
- Configurar as MESMAS envs no **Vercel** (`DATABASE_URL` prod, `CRON_SECRET`, chaves Google **rotacionadas**, Resend, Cloudinary, `NEXT_PUBLIC_SITE_URL`, `CANONICAL_HOST`).
- Deploy.

### Rollback

O script nunca apaga. Se algo sair errado no prod, dá pra limpar as tabelas do prod e rodar de novo (idempotente). O dev permanece intacto como fonte.

---

## Pós-migração

- [ ] Rotacionar chaves Google + OAuth secret + senhas de banco
- [ ] Restringir chave Google por referrer/IP
- [ ] Setar `CRON_SECRET` na Vercel → me avisar pra travar o cron (fail-closed)
- [ ] Smoke test: home, listagem, detalhe, login admin, painel
