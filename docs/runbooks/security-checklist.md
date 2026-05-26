# Runbook — Segurança pré-lançamento

> Estado da segurança do **Achei no Jardim Botânico** + ações de hardening.
> Auditoria feita em mai/2026.

---

## ✅ Já está protegido (verificado no código)

- **Chave Google é server-only** — `GOOGLE_PLACES_API_KEY` nunca vai pro client
  (sem `NEXT_PUBLIC_`); usada só na importação e no proxy de fotos.
- **IDOR coberto** — rotas por id (`produtos/[id]`, `eventos/[id]`, `fotos/[photoId]`)
  só agem se o recurso pertence ao negócio do usuário logado.
- **Rotas admin** checam `session.user.role === "ADMIN"`.
- **Upload** exige login + whitelist de tipo (JPG/PNG/WEBP) + limite de 5 MB + pasta por usuário.
- **Webhook Asaas** valida `asaas-access-token` contra `ASAAS_WEBHOOK_SECRET`.
- **Cron** (`/api/cron/expirar-planos`) exige `Authorization: Bearer ${CRON_SECRET}`.
- **Headers de segurança + CSP** configurados em `next.config.ts` (X-Frame-Options,
  nosniff, Referrer-Policy, Permissions-Policy, CSP com allowlist).
- **Validação Zod** nas rotas de mutação; senhas com bcrypt; sessão em banco.

## 🔧 Hardening aplicado nesta rodada

- **Rate-limit no `verify-email`** — antes o código de 6 dígitos podia ser
  força-bruta (1M combinações). Agora: 10 tentativas / 15 min por email+IP.
- **Rate-limit no `reset-password`** — 10 / 15 min por IP (higiene anti-DoS).
- **Rate-limit no `geocode`** — 60 / min por usuário (protege o proxy externo Photon).
- Rate-limit que já existia: `login` (10/15min), `register` (3/h), `forgot-password`
  (5/h), `resend-verification` (3/h).

---

## 🔑 AÇÃO MANUAL — Restringir a chave Google (Google Cloud Console)

A chave de produção precisa ser **restrita** para não poder ser abusada se vazar.

1. Acesse **console.cloud.google.com** → projeto do Achei → **APIs & Services → Credentials**
2. Abra a **API key** de produção
3. **Application restrictions:**
   - Como a chave é usada **no servidor** (Vercel), o ideal seria *IP addresses*.
     Porém o Vercel **não tem IPs fixos** no plano padrão. Então:
     - Opção A (recomendada p/ agora): deixar **None** mas aplicar forte
       **API restrictions** (passo 4) + monitorar custo no painel `/dashboard/admin/custos`.
     - Opção B (mais seguro): rodar as chamadas Google por um proxy/IP fixo
       (Cloud Run/Functions com IP estático) — só quando o volume justificar.
4. **API restrictions** → *Restrict key* → marcar **apenas**:
   - **Places API (New)**
   - **Maps Static API** *(só se usar)* — hoje o mapa é OSM, então **não precisa**
   - Nada além disso.
5. **Salvar.** Confirmar que a importação e as fotos seguem funcionando.
6. Ative **alertas de orçamento** (Billing → Budgets & alerts) — ex.: alerta em US$ 50.

> Lembrete: o **mapa do perfil usa OpenStreetMap** (sem chave). A chave Google
> serve só pra importação + proxy de fotos.

---

## 🔭 Pendências de segurança (pós-MVP)
- Rate-limit hoje é **em memória** (por instância) — ver ADR 0006. Em escala,
  migrar para um store compartilhado (Upstash/Redis) para limites globais.
- 2FA opcional para admin.
- Revisão periódica de dependências (`npm audit`).
