# Achei no Jardim Botânico — Guia para Claude Code

> Este arquivo é carregado automaticamente pelo Claude Code em toda sessão.
> Leia completamente antes de fazer qualquer alteração.

---

## O que é este projeto?

**Achei no Jardim Botânico** é um guia comercial digital hiperlocal para a região do Jardim Botânico (DF).
Moradores encontram negócios locais. Comerciantes pagam mensalidade para ter destaque.
Stack: Next.js 15 (App Router) + TypeScript + MySQL (Prisma) + Asaas + Hostinger (Node, auto-deploy no `git push`).
**Domínio:** acheinojardimbotanico.com.br | **Branch ativo:** main | **Status:** MVP — Specs 001–008 implementadas (importação Places, listagem/detalhe público, claim, painel anunciante, admin, Asaas)

---

## Arquivos de Contexto — LEIA ANTES DE CODAR

| Arquivo | Quando ler |
|---------|-----------|
| `.specify/memory/constitution.md` | Princípios invioláveis — leia em TODA sessão |
| `docs/discovery/lean-inception.md` | Visão, personas, MVP, releases |
| `docs/discovery/jobs-to-be-done.md` | Jobs to Be Done das personas |
| `docs/adr/` | Decisões arquiteturais |
| `spec.md` | Documento mestre completo |

---

## Regras Críticas — NUNCA ignore

1. **Não alterar schema Prisma** sem confirmar com o usuário
2. **Não mudar sistema de autenticação** (NextAuth) sem discussão
3. **Não mexer em lógica de cobrança/Asaas** sem entender o impacto
4. **Sempre usar** `import { db } from "@/lib/prisma"` para Prisma
5. **Sempre usar** `import { auth } from "@/lib/auth"` para sessão
6. **Sempre validar** inputs com Zod nas Server Actions e API Routes
7. **Mobile-first** — quebrou em 375px, não está pronto
8. **Role de admin é `ADMIN`** — nunca usar outra string para verificar permissão de admin

---

## Padrões Obrigatórios

### Server Action
```typescript
"use server"
const session = await auth()
if (!session?.user) return { error: "Não autorizado" }
// valida com Zod → verifica permissão → executa → revalidatePath
```

### Importações
```typescript
import { db } from "@/lib/prisma"   // sempre assim
import { auth } from "@/lib/auth"   // sempre assim
import { cn } from "@/lib/utils"    // para classnames
```

### Verificação de permissão admin
```typescript
const session = await auth()
if (session?.user?.role !== "ADMIN") redirect("/dashboard")
```

---

## Personas (lembre sempre)

- **Marina** — moradora, encontra negócios via SEO. É o tráfego que valida o produto.
- **Roberto** — comerciante local, paga R$79/mês por destaque. É a receita do MVP.
- **Álvaro** — operador/admin, usa o painel admin todo dia. É a eficiência operacional.

**Teste de toda feature:** "isso resolve a dor do Roberto hoje?" — se não, sai.

---

## Schema Prisma (aplicado)

O schema do Achei já está em `prisma/schema.prisma` e aplicado no banco de dev:
`User`, `Account`, `Session`, `AuthToken`, `Business`, `Category`, `Photo`,
`ClaimRequest`, `BusinessView`, `WhatsappClick`, `Subscription`, `AuditLog`
(enums: `UserRole`, `BusinessStatus`, `Plan`, `ClaimStatus`, `PhotoSource`, `SubStatus`, `TokenType`).
- Role admin = `ADMIN`. Role do anunciante após claim aprovado = `ADVERTISER`.
- Senha no campo `passwordHash` (não `password`).
- **NÃO FAÇA `db push`** com mudança de schema sem confirmar — o banco tem dados.
- Prisma 5.17.0: use `node_modules/.bin/prisma` (o `npx prisma` puxa a v7, incompatível).

---

## Asaas — Provedor de Pagamento

- PIX, cartão, boleto — foco no Brasil
- Plano Visibilidade: R$79/mês | Plano Premium: R$197/mês
- Webhook: `/api/asaas/webhook`
- Variáveis: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET`

---

## Mapa de Rotas (implementado)

### Públicas
| Rota | Descrição |
|------|-----------|
| `/` | Homepage com browse por categoria |
| `/[bairro]/[categoria]` | Listagem pública + busca + filtro "aberto agora" (ISR 1h) |
| `/[bairro]/[categoria]/[slug]` | Detalhe do negócio (tracking de view/whatsapp, JSON-LD) |
| `/reivindicar/[businessId]` | Fluxo de reivindicação |
| `/sitemap.xml`, `/robots.txt` | SEO |

### Dashboard — Anunciante (`/dashboard/*`)
| Rota | Descrição |
|------|-----------|
| `/dashboard` | Home com métricas (views/cliques 7d) |
| `/dashboard/negocio` | Editar perfil + upload de fotos (limite por plano) |
| `/dashboard/plano` | Assinatura + checkout Asaas |
| `/dashboard/conta` | Dados + exclusão LGPD |

### Dashboard — Admin (`/dashboard/admin/*`)
| Rota | Descrição |
|------|-----------|
| `/dashboard/admin` | Painel geral (KPIs) |
| `/dashboard/admin/negocios` | Lista de negócios (filtro + paginação) |
| `/dashboard/admin/claims` | Aprovar/rejeitar reivindicações |
| `/dashboard/admin/usuarios` | Lista de usuários |
| `/dashboard/admin/import` | Importação via Places API |
| `/dashboard/admin/audit` | Log de auditoria pesquisável |

### APIs principais
`/api/admin/import`, `/api/claims`, `/api/admin/claims/[id]`, `/api/track/{view,whatsapp}`,
`/api/dashboard/negocio` (+`/fotos`), `/api/asaas/{checkout,webhook}`,
`/api/forgot-password`, `/api/reset-password`, `/api/lgpd/delete-my-data`

---

## Versionamento & Release (produção estável)

> Toda subida para produção passa por aqui. Objetivo: **nunca perder dado** e **sempre saber o que está no ar**.

### Versão (SemVer) — `MAJOR.MINOR.PATCH`
- **Fonte única:** campo `version` do `package.json`. Exposto via `next.config.ts` (`env.NEXT_PUBLIC_APP_VERSION`) e lido em `src/lib/version.ts`. Aparece no **rodapé público** (`v1.18.0`, canto inferior direito).
- **Quando subir cada número:**

  | Mudança | Bump | Comando | Exemplo |
  |---------|------|---------|---------|
  | Correção / ajuste pequeno | PATCH | `npm run patch` | 1.18.0 → 1.18.1 |
  | Marco / feature relevante | MINOR | `npm run end-sprint` | 1.18.x → 1.19.0 |
  | Grande marco / reescrita | MAJOR | `npm run release` | 1.x → 2.0.0 |

- Os scripts usam `npm version`: **atualizam o `package.json`, criam o commit e a tag `vX.Y.Z`** (commit a feature ANTES — o `npm version` exige árvore limpa). A tag é ponto de rollback (`git checkout vX.Y.Z`).
- **Histórico:** `CHANGELOG.md` na raiz. Toda versão ganha uma entrada no topo. Se a release mexeu no banco, marque **`(inclui migration)`**.
- **Regra de ouro:** todo deploy = 1 bump de versão + 1 linha no CHANGELOG. É assim que se confere, olhando o rodapé do site, se o deploy subiu.

### Banco — Prisma Migrate (NUNCA mais `db push` em produção)
`db push` força o schema e **pode apagar coluna/tabela com dado**. Em produção, só **migrations versionadas**:
- **Dev:** `node_modules/.bin/prisma migrate dev --name descricao` → cria o SQL em `prisma/migrations/` e aplica no dev.
- **Produção:** `node_modules/.bin/prisma migrate deploy` → aplica só as pendentes, **nunca reseta**.
- **PROIBIDO em produção:** `migrate dev`, `migrate reset`, `db push` (podem resetar/derrubar dados).
- **Setup único (baselining) — PENDENTE:** como o banco nasceu de `db push`, antes do 1º `migrate deploy` é preciso baselinar (gerar a migration `0_init` do estado atual e marcá-la com `migrate resolve --applied`). **Confirmar com o Álvaro antes de rodar.**

### As 3 leis da mudança de schema com usuários ao vivo (aditivo primeiro)
1. **Só ADICIONE** junto com o código que precisa. Coluna nova = **nullable ou com default**.
2. **Nunca APAGUE/RENOMEIE** coluna que o código no ar ainda usa.
3. Apagar/renomear só num deploy **posterior**, depois que o código já parou de usar.
   *Renomear = adicionar a nova → copiar o dado (backfill) → trocar o código → (depois) apagar a velha.*

### Checklist de deploy
```
COM MUDANÇA DE SCHEMA:
  □ 1. Backup do banco de produção
  □ 2. Revisar o SQL da migration → APAGA/RENOMEIA algo? Se sim, PARA e separa (3 leis)
  □ 3. Aplicar a migration no DEV primeiro → testar o app
  □ 4. Produção: prisma migrate deploy
  □ 5. Bump de versão + linha no CHANGELOG "(inclui migration)"
  □ 6. git push (auto-deploy Hostinger) → aguardar o build (~2-5 min)
  □ 7. Smoke test: login + 1 página chave + criar/editar 1 registro
  □ 8. Conferir o rodapé: versão nova subiu? UptimeRobot no ar?

SÓ CÓDIGO (95% dos casos):
  □ Bump de versão (npm run patch) + linha no CHANGELOG → git push. Sem banco, sem medo.
```

---

## Regras de Trabalho

1. Spec antes de código: toda feature passa por spec → plan → tasks → implement
2. Se uma tarefa tomar mais de 1h, pausa e mostra o estado atual
3. Nunca rode comando destrutivo sem confirmação explícita
4. Honestidade técnica acima de agradar — se algo está mal pensado, fala

---

*Criado em: 2026-05-21 | Projeto iniciado a partir da base do Courtesyfy*
