# Spec — Onboarding do Operador (multi-tenant)

> Status: **SPEC — não implementar antes do Gate 1** (10 pagantes no JBT). Regra de ouro do plano.
> Criado em 2026-06-08 · Decisão arquitetural central registrada aqui; vira ADR quando a implementação começar.

---

## 1. A decisão que muda tudo: multi-TENANT, não multi-INSTALAÇÃO

**Ideia original (Álvaro):** cada operador "instala" a plataforma na cidade dele, colocando as próprias chaves (Google login, Places API, banco de dados, domínio), tudo criptografado.

**Correção de rota (recomendação forte):** o operador **não instala nada e não vê chave nenhuma**. É **UMA aplicação, UM banco, N praças (tenants)** — o operador preenche um wizard de NEGÓCIO (10–15 min) e a praça nasce no ar.

### Por quê (honestidade técnica)

| Critério | N instalações (ideia original) | 1 app multi-tenant (recomendado) |
|---|---|---|
| Persona do operador | Exige perfil técnico — **mata a venda** (Otávio é vendedor, não dev) | Zero técnica: wizard e pronto |
| Suporte (gargalo do Álvaro, 1h/dia) | 100 praças = 100 deploys, 100 bancos, 100 versões quebrando diferente | 1 deploy, 1 migração, 1 versão |
| Custo por praça | Banco + hosting + chaves Google POR OPERADOR (cada um configurando Google Cloud 😱) | Custo marginal ≈ zero |
| Evolução do produto | Feature nova = atualizar N instâncias | Feature nova = todos ganham no mesmo dia |
| Controle da rede (métricas, qualidade, gate de meta) | Nenhum — cada um é uma ilha | Painel central vê tudo |
| Risco de pirataria do código | Alto (código entregue) | Baixo (SaaS) |

A intuição original estava certa no objetivo (**onboarding sem fricção**) e errada no meio (instalação). A fricção certa é ZERO instalação.

### Onde chaves PRÓPRIAS do operador fazem sentido (e só aqui)
1. **Gateway de pagamento (Asaas/MP do OPERADOR):** o dinheiro dos anunciantes deve cair na conta DELE (clareza fiscal; sem intermediação de fundos no piloto). Ele cola a API key do Asaas dele no wizard → criptografada (ver §5).
2. **WhatsApp de contato da praça** (número dele).
3. **Nada mais.** Google OAuth, Places, banco, e-mail transacional, domínio técnico: tudo central nosso. Custo de Places controlado por **teto de importação por plano** (ex.: 300 negócios inclusos; excedente cobrado).

---

## 2. O wizard do operador (a "instalação" de 10–15 minutos)

```
Passo 1 — Praça:       cidade/UF + área de cobertura (centro/bairros) → define slug: acheiem{cidade}
Passo 2 — Marca:       nome da praça (padrão "Achei em {Cidade}"), logo (upload OU gerador automático
                       na identidade Flora), cor de destaque (presets)
Passo 3 — Contato:     WhatsApp da praça, e-mail, Instagram
Passo 4 — Recebimento: API key do Asaas DELE (ou link Mercado Pago) → criptografada at-rest
Passo 5 — Importação:  clica "Importar negócios" → roda Places com a NOSSA chave, teto do plano
                       (ex.: 300 negócios), progresso em tela
Passo 6 — No ar:       https://{slug}.redeachei.com.br ativo + checklist do playbook (primeiros 15 contatos)
```

O que o operador NUNCA vê: chave Google, banco, deploy, DNS técnico, código.

---

## 3. Modelo de dados (aditivo — as 3 leis valem aqui)

```prisma
model Tenant {
  id         String   @id @default(cuid())
  slug       String   @unique          // "jardim-botanico", "patos-de-minas"
  name       String                    // "Achei no Jardim Botânico"
  city       String
  state      String
  status     TenantStatus @default(TRIAL)  // TRIAL | ACTIVE | SUSPENDED
  branding   Json?                     // logo, cores, tagline
  contact    Json?                     // whatsapp, email, instagram
  operatorId String?                   // User dono da praça (role OPERATOR)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// Aditivo nos modelos existentes (nullable → backfill → exigir):
// Business.tenantId, User.tenantId (null = admin da rede), Photo via Business,
// PlanConfig/PaymentConfig POR tenant (cada praça tem seu preço/gateway),
// AuditLog.tenantId. Índices compostos: @@index([tenantId, slug]) etc.
```

**Migração do JBT:** criar tenant `jardim-botanico` → backfill de TODOS os registros atuais → JBT vira a praça nº 1 (a loja-modelo dentro do próprio sistema). Migration aditiva, zero perda, pelo processo do CLAUDE.md (backup → dev → deploy).

Novo papel: `OPERATOR` no enum `UserRole` (admin DA PRAÇA, não da rede; `ADMIN` continua sendo só o Álvaro).

---

## 4. Resolução de tenant (request → praça)

- **v1 — Subdomínio:** `{slug}.redeachei.com.br` (DNS wildcard). Middleware lê o `Host` → resolve tenant (cache em memória) → injeta `tenantId` no contexto → toda query filtra por `tenantId`.
- **v1 — JBT preservado:** `acheinojardimbotanico.com.br` mapeia para o tenant `jardim-botanico` (domínio legado = apelido de tenant). Nada quebra, SEO preservado.
- **v2 — Domínio próprio por praça** (feature de plano superior): CNAME do operador → nosso proxy. ⚠️ **Limitação real:** SSL automático por hostname custom na Hostinger Node atual é fraco. Quando chegar a v2, mover o front da rede para infra com SSL automático (Cloudflare/Vercel) ou proxy dedicado (Traefik/Caddy). Registrado para não nos surpreender.

---

## 5. Segurança dos segredos por tenant (a parte criptografada da ideia original — mantida e melhorada)

- Tabela `TenantSecret` (ou campo JSON cifrado): valores **AES-256-GCM**, chave-mestra `TENANT_SECRETS_KEY` só no env do servidor (nunca no client, nunca no repo).
- Cada segredo: `{ iv, ciphertext, authTag, keyVersion }` → suporta **rotação de chave** sem re-onboarding.
- Acesso de leitura só em server-side (rotas de cobrança da praça). Auditoria: toda leitura/escrita de segredo gera `AuditLog`.
- O que vira segredo de tenant: API key Asaas do operador, token MP. Só.

---

## 6. Billing em dois andares (clareza fiscal desde o dia 1)

| Fluxo | De quem → para quem | Gateway |
|---|---|---|
| Anunciante paga a praça | Comerciante → **Operador** | Asaas/MP DO OPERADOR (key dele, cifrada) |
| Operador paga a rede | Operador → **Álvaro** | NOSSO Asaas (assinatura R$397/mês + setup) |

Sem split, sem intermediação de fundos no piloto. Painel da rede mostra MRR da praça **medido pelo sistema** (assinaturas ativas na praça) — transparência sem tocar no dinheiro.

---

## 7. Painel da rede (admin Álvaro)

- Lista de praças: status, operador, anunciantes ativos, MRR da praça, última atividade.
- **Health score por praça** (anunciantes ativos × atividade do operador × inadimplência) → quem precisa de ajuda ANTES de churnar.
- Gate automático: praça abaixo da meta no mês 4 → alerta de exclusividade.

---

## 8. Esforço estimado (1h/dia, ordem de grandeza)

| Etapa | Conteúdo | Estimativa |
|---|---|---|
| A | Tenant no schema + backfill JBT + resolução por Host | 2–3 semanas |
| B | Papel OPERATOR + permissões por praça | 1–2 semanas |
| C | Wizard do operador (6 passos) + importação com teto | 3–4 semanas |
| D | Billing da rede + secrets cifrados | 2 semanas |
| E | Painel da rede + health score | 2 semanas |
| **Total** | | **~10–13 semanas de 1h/dia** — começa SÓ após o Gate 1 |

---

## 9. O que esta spec NÃO cobre (decisões adiadas de propósito)

- App mobile, split de pagamento, franquia formal (COF), domínio próprio v2, i18n.
- Migração de hosting — só se/quando a v2 de domínios exigir.

*Princípio: o JBT continua mandando. Cada linha de código multi-tenant só nasce quando a loja-modelo provar que merece uma rede.*
