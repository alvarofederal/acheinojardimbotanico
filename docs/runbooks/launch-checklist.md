# Runbook — Checklist de Lançamento (go-live)

> Passo a passo para colocar o **Achei no Jardim Botânico** no ar com o domínio
> próprio e pagamentos reais. Siga na ordem. Cada item tem **[ ]** para marcar.

---

## Fase 0 — Antes de começar
- [ ] Build local passa: `npm run build`
- [ ] Type-check limpo: `node_modules/.bin/tsc --noEmit`
- [ ] Testes principais ok: `npm run test:plans` e `npm run test:expire`
- [ ] Banco de produção **é o mesmo** que tem os dados (confirmado: `u937845481_ajb_dev_db`)
- [ ] Último commit em `main` está pushado (deploy do Vercel sai de `main`)

---

## Fase 1 — Domínio
- [ ] Comprar `acheinojardimbotanico.com.br` (registro.br)
- [ ] No **Vercel** → Project → **Settings → Domains** → adicionar o domínio (apex + `www`)
- [ ] No **registro.br**, apontar os DNS conforme o Vercel indicar:
  - Apex (`acheinojardimbotanico.com.br`) → registro **A** `76.76.21.21` (ou o que o Vercel mostrar)
  - `www` → registro **CNAME** `cname.vercel-dns.com`
- [ ] Aguardar propagação + certificado SSL automático do Vercel (pode levar minutos/horas)
- [ ] Abrir `https://acheinojardimbotanico.com.br` e ver o site

---

## Fase 2 — Variáveis de ambiente no Vercel
> Project → **Settings → Environment Variables** (escopo **Production**). Após
> adicionar/alterar, é preciso **Redeploy** para valer.

**Obrigatórias:**
- [ ] `DATABASE_URL` — string MySQL de produção
- [ ] `AUTH_SECRET` — gere com `openssl rand -base64 32` (sessão NextAuth)
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://acheinojardimbotanico.com.br` (URL canônica usada em links/emails/SEO)
- [ ] `CANONICAL_HOST` = `acheinojardimbotanico.com.br` (faz o `.vercel.app` redirecionar 301 pro domínio)
- [ ] `GOOGLE_PLACES_API_KEY` — **necessária em produção** (o proxy de fotos `/api/photo` depende dela; sem isso as fotos do Google quebram)
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` (ex.: `Achei no JBT <noreply@acheinojardimbotanico.com.br>`) — emails de verificação, claim, pagamento
- [ ] `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` — upload de fotos do anunciante
- [ ] `CRON_SECRET` — gere com `openssl rand -hex 32` (protege `/api/cron/expirar-planos`)

**Se usar login com Google:**
- [ ] `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (e adicionar o domínio nas *Authorized redirect URIs* no Google Console: `https://acheinojardimbotanico.com.br/api/auth/callback/google`)

**Opcionais:**
- [ ] `NEXT_PUBLIC_GA_ID` — Google Analytics 4 (se quiser)
- [ ] `ASAAS_API_KEY` / `ASAAS_WEBHOOK_SECRET` / `ASAAS_ENV` — **só** quando ativar pagamento automático (hoje dormente)

> ⚠️ Dica: o email `EMAIL_FROM` precisa de um **domínio verificado no Resend**
> (DNS SPF/DKIM). Sem isso os emails caem em spam ou não saem.

---

## Fase 3 — Cron (expiração de plano)
- [ ] O `vercel.json` já agenda `/api/cron/expirar-planos` às 3h diárias (não precisa mexer)
- [ ] Confirmar que `CRON_SECRET` está setado (o Vercel injeta como `Authorization: Bearer`)
- [ ] Após o 1º deploy, em **Vercel → Crons**, verificar que o job aparece como agendado

---

## Fase 4 — Pagamento (manual)
- [ ] Em `/dashboard/admin/pagamento`, preencher:
  - PIX: chave + recebedor + **copia-e-cola SEM valor fixo** (cobre todos os planos/períodos)
  - Link Mercado Pago do **Visibilidade** (valor mensal) e do **Premium** (valor mensal)
  - Conferir preços/limites/recursos de cada plano
- [ ] Teste real ponta-a-ponta:
  1. Criar uma conta de teste (anunciante) e reivindicar/cadastrar um negócio
  2. Em `/dashboard/plano`, escolher um plano e clicar "Já paguei"
  3. Fazer um PIX real de R$1 pra você mesmo (ou usar o valor do plano)
  4. Em `/dashboard/admin/pagamentos`, **confirmar** e ver o plano ativar + email chegar

---

## Fase 5 — Verificação pós-deploy (smoke test em produção)
- [ ] Home carrega e lista negócios com **fotos** (valida `GOOGLE_PLACES_API_KEY`)
- [ ] Perfil de negócio: mapa aparece, "Como chegar" funciona, fotos abrem
- [ ] Buscar uma categoria e abrir um negócio
- [ ] Login + cadastro + email de verificação chegam
- [ ] `/dashboard/admin/...` acessível só como ADMIN
- [ ] `https://acheinojardimbotanico.vercel.app` redireciona 301 → domínio (valida `CANONICAL_HOST`)
- [ ] `/sitemap.xml` e `/robots.txt` respondem

---

## Fase 6 — Pós-lançamento (entra na frente 3 — SEO)
- [ ] Google Search Console: verificar propriedade + enviar `sitemap.xml`
- [ ] Conferir Analytics recebendo visitas
- [ ] Avisar primeiros anunciantes 🎉

---

### Geração rápida de segredos
```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # CRON_SECRET
```
