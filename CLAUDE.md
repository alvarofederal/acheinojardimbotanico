# Achei no Jardim Botânico — Guia para Claude Code

> Este arquivo é carregado automaticamente pelo Claude Code em toda sessão.
> Leia completamente antes de fazer qualquer alteração.

---

## O que é este projeto?

**Achei no Jardim Botânico** é um guia comercial digital hiperlocal para a região do Jardim Botânico (DF).
Moradores encontram negócios locais. Comerciantes pagam mensalidade para ter destaque.
Stack: Next.js 15 (App Router) + TypeScript + MySQL (Prisma) + Asaas + Vercel.
**Domínio:** acheinojardimbotanico.com.br | **Branch ativo:** main | **Status:** Release 0 — base limpa, schema a aplicar

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

## Schema Prisma (a aplicar)

O schema atual (`prisma/schema.prisma`) ainda é do Courtesyfy e será substituído.
O schema correto está na **Parte 6.2 do spec.md**.
**NÃO FAÇA `db push`** sem confirmar com o usuário — o banco atual pode ter dados.

---

## Asaas — Provedor de Pagamento

- PIX, cartão, boleto — foco no Brasil
- Plano Visibilidade: R$79/mês | Plano Premium: R$197/mês
- Webhook: `/api/asaas/webhook`
- Variáveis: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET`

---

## Mapa de Rotas (planejado)

### Públicas
| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/[bairro]/[categoria]` | Listagem pública (ex: `/jardim-botanico/cafeterias`) |
| `/[bairro]/[categoria]/[slug]` | Detalhe do negócio |

### Dashboard — Anunciante (`/dashboard/*`)
| Rota | Descrição |
|------|-----------|
| `/dashboard` | Home com métricas do negócio |
| `/dashboard/negocio` | Editar perfil do negócio |
| `/dashboard/plano` | Gerenciar assinatura |

### Dashboard — Admin (`/dashboard/admin/*`)
| Rota | Descrição |
|------|-----------|
| `/dashboard/admin` | Painel geral |
| `/dashboard/admin/negocios` | CRUD de negócios |
| `/dashboard/admin/claims` | Reivindicações pendentes |
| `/dashboard/admin/import` | Importação via Places API |

---

## Regras de Trabalho

1. Spec antes de código: toda feature passa por spec → plan → tasks → implement
2. Se uma tarefa tomar mais de 1h, pausa e mostra o estado atual
3. Nunca rode comando destrutivo sem confirmação explícita
4. Honestidade técnica acima de agradar — se algo está mal pensado, fala

---

*Criado em: 2026-05-21 | Projeto iniciado a partir da base do Courtesyfy*
