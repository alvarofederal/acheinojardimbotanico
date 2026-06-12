# 🏡 Migração para VPS — Runbook Completo

> **Achei no Jardim Botânico** · Migração: hospedagem compartilhada → VPS Hostinger
> Executada em **11/06/2026**, em uma noite, sem perda de dados e sem janela de manutenção planejada.
> Este documento é o registro minucioso de TODOS os passos — serve como histórico, manual de
> reconstrução do servidor do zero e material de estudo.
>
> 📄 *Para gerar o PDF: abra este arquivo no VS Code → `Ctrl+Shift+V` (preview) → imprimir em PDF;
> ou use a extensão "Markdown PDF".*

---

## 1. Contexto — por que migramos

| | |
|---|---|
| **Sintoma** | Site caía em loop (HTTP 503) várias vezes ao dia |
| **Causa raiz** | O motor do Prisma (query engine, em Rust) morria com `PANIC: timer has gone away` — a hospedagem **compartilhada** impõe limites invisíveis de recursos (CloudLinux/LVE) que negavam a criação de threads do motor nos picos |
| **O que tentamos antes** | Prisma 5.17→5.22, motor binário (`engineType=binary`), batimento de presença 12s→60s, boot resiliente, `/api/health` — o app ficou mais leve, mas o teto era da hospedagem |
| **Por que não Vercel** | Já estourou o limite grátis no passado; plano pago em dólar — vetado (decisão registrada) |
| **Decisão** | **VPS Hostinger** (em reais, ~R$ 25-40/mês): recursos dedicados, controle total, e a infra que a Rede Achei vai exigir (SSL wildcard para subdomínios) |

## 2. Arquitetura final

```
Visitante
   │  https (443) / http (80 → redireciona)
   ▼
┌──────────────────────────── VPS Hostinger (2.25.199.147) ───────┐
│  Ubuntu 24.04 LTS · firewall UFW (só portas 22, 80, 443)        │
│                                                                  │
│  Caddy ──────────► certificado HTTPS automático (Let's Encrypt,  │
│    │                 auto-renovável; Caddyfile: apex + www)      │
│    ▼ reverse_proxy                                               │
│  localhost:3000                                                  │
│    ▲                                                             │
│  PM2 ("porteiro-robô") ── mantém o app vivo, religa em crash,    │
│    │                       autostart no boot (systemd)           │
│    ▼                                                             │
│  Next.js (npm start) ── app em /var/www/achei (.env só aqui)     │
└────────────┬─────────────────────────────────────────────────────┘
             │ conexão MySQL remota
             ▼
   MySQL — continua na hospedagem COMPARTILHADA Hostinger
   (banco u937845481_ajb_prd_db; e-mail e DNS também ficam lá)
```

**Princípio adotado:** *o VPS é descartável* — nada insubstituível mora nele. Código no GitHub,
segredos reconstruíveis, banco fora. Se o servidor morrer, este runbook o reconstrói em ~1h.

## 3. Pré-requisitos

- Chave SSH pessoal no PC: `C:\Users\alvar\.ssh\id_ed25519` (par criado com `ssh-keygen -t ed25519`)
  — **NUNCA dentro de pasta de projeto/repositório** (risco de vazar no GitHub)
- Conta Hostinger com VPS contratado (KVM, Ubuntu 24.04 LTS **puro, sem painel**)
- Acesso ao repositório GitHub do projeto
- Os valores do `.env` de produção em mãos (sem nunca colá-los em chats)

## 4. Passo a passo executado

### 4.1 Compra do VPS
1. hPanel → VPS → escolher plano **KVM 1** (upgrade sem reinstalar é possível depois)
2. SO: **Ubuntu 24.04 LTS** (plain, sem painel — Caddy/PM2 fazem o trabalho)
3. Adicionais: detector de malware **grátis = sim**; backups pagos **não** (nada insubstituível no VPS); Docker **não**
4. Colar a **chave SSH pública** do PC na compra (login sem senha)
5. Senha root forte → gerenciador de senhas

### 4.2 Primeiro acesso
```bash
# No PC (PowerShell) — o Windows tem SSH nativo:
ssh root@2.25.199.147
# Primeira vez: "Are you sure you want to continue connecting?" → yes
```
> 💡 **Lição #1 — a "placa" do prompt:** `root@srv...#` = você está NO SERVIDOR;
> `PS C:\...>` = você está no SEU PC. Olhar SEMPRE antes de colar comando.
> 💡 **Lição #2 — keepalive:** conexão SSH caía por inatividade. Fix no PC, arquivo
> `C:\Users\alvar\.ssh\config`: `Host *` + `ServerAliveInterval 30` + `ServerAliveCountMax 4`.

### 4.3 Atualizar o sistema
```bash
apt update && apt upgrade -y
# Se aparecer tela lilás "Which services should be restarted?" → Enter (padrão)
```

### 4.4 Firewall (UFW) — a ordem importa!
```bash
ufw allow OpenSSH    # PRIMEIRO liberar o SSH (senão você se tranca fora)
ufw allow 80/tcp     # http (desafio do certificado + redirect)
ufw allow 443/tcp    # https
ufw --force enable
ufw status           # conferir: 22, 80, 443 ALLOW
```

### 4.5 Node.js 22 + PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v && npm -v          # v22.x

npm install -g pm2
pm2 -v
```

### 4.6 Deploy key (o "crachá de leitura" do servidor no GitHub)
```bash
ssh-keygen -t ed25519 -C "vps-achei" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub   # copiar a linha inteira
```
GitHub → repo → **Settings → Deploy keys → Add deploy key** → título `VPS Achei` →
colar → **write access DESMARCADO** (menor poder: o servidor só lê).

### 4.7 Clonar o projeto
```bash
apt install -y git
mkdir -p /var/www && cd /var/www
git clone git@github.com:alvarofederal/acheinojardimbotanico.git achei
# fingerprint do GitHub → yes
```

### 4.8 O `.env` de produção (segredos)
Montado **no PC** a partir do `.env` local com 3 transformações (sem expor valores em chat):
- `DATABASE_URL` ← valor do banco de **produção** (não o de dev!)
- `NEXT_PUBLIC_URL` e `AUTH_URL` ← `https://www.acheinojardimbotanico.com.br`
- Removidas as variáveis de migração (`SRC_/DST_DATABASE_URL`)

Transferido com **scp** (criptografado, PC → servidor):
```powershell
scp "C:\...\.env.vps" root@2.25.199.147:/var/www/achei/.env
```
O arquivo temporário do PC foi **apagado** após a transferência.
> Verificação segura de qual banco está configurado (mostra só o nome, sem senha):
> `grep -o 'ajb_[a-z]*_db' /var/www/achei/.env | head -1` → deve responder `ajb_prd_db`

### 4.9 Dependências + build
```bash
cd /var/www/achei
npm ci          # instala exatamente o package-lock (com prisma generate no postinstall)
npm run build   # tem que terminar com a tabela de rotas, sem erro
```

### 4.10 Ligar com PM2 + autostart
```bash
pm2 start npm --name achei -- start
pm2 save                       # congela a lista de apps
pm2 startup                    # registra no systemd (religa tudo após reboot)
# Teste de ouro (app + banco):
curl -s localhost:3000/api/health
# → {"ok":true,"db":true,"version":"x.y.z"}
```

### 4.11 Caddy (HTTPS automático)
```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```
`/etc/caddy/Caddyfile` (4 linhas — todo o HTTPS automático mora aqui):
```
acheinojardimbotanico.com.br, www.acheinojardimbotanico.com.br {
    reverse_proxy localhost:3000
}
```
```bash
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy
```
> 💡 **Lição #3 — copiar/colar de chats linkifica URLs:** o "www.dominio" colado de um chat
> virou `[www...](https://www...)` dentro do arquivo. Conferir com `grep -c '\[' arquivo`
> (tem que dar 0). Em caso teimoso, escrever o arquivo via `echo "BASE64" | base64 -d > arquivo`.

### 4.12 DNS — a troca de endereço
No hPanel → Zona DNS do domínio (**só** estes dois; MX/TXT/domainkey são do E-MAIL — não tocar):
1. **Remover** o `ALIAS @ → ...cdn.hstgr.net` → **Adicionar** `A` · nome `@` · valor `2.25.199.147` · TTL 300
2. **Editar** o `CNAME www → ...cdn.hstgr.net` → destino `acheinojardimbotanico.com.br` (espelho do @)

### 4.13 Certificado e verificação final
```bash
# Se o Caddy tentou emitir ANTES do DNS propagar, ele entra em retry com espera.
# Forçar nova tentativa imediata:
systemctl restart caddy
journalctl -u caddy --since "2 minutes ago" --no-pager | tail -15  # "certificate obtained"
```
Verificações de fora:
- `https://www.acheinojardimbotanico.com.br/api/health` → `{"ok":true,"db":true,...}` com cadeado válido
- Site navegável, login e-mail/senha, **login Google** (funcionou na casa nova!), painel admin

### 4.14 Desligamento da casa velha
- hPanel → site antigo → **Git → desconectar** (parar o auto-deploy fantasma)
- Após ~1 semana de estabilidade: **Remover o aplicativo Node** do shared
- ⚠️ **O MySQL do shared fica PARA SEMPRE** (é o banco de produção!)

## 5. Operação do dia a dia (cola rápida)

| Quero... | Comando (no servidor) |
|---|---|
| Ver se o app está vivo | `pm2 status` |
| Logs do app (ao vivo) | `pm2 logs achei --lines 50` |
| Reiniciar o app | `pm2 restart achei` |
| Saúde app+banco | `curl -s localhost:3000/api/health` |
| Logs do Caddy/SSL | `journalctl -u caddy -n 30 --no-pager` |
| **Deploy manual** | `cd /var/www/achei && git pull && npm ci && npm run build && pm2 restart achei` |
| Uso de recursos | `htop` (instalar: `apt install -y htop`) |

*(Com a esteira CI/CD ativa, o deploy manual vira plano B — o normal é `git push` e pronto.)*

## 6. Rollback de emergência

```bash
cd /var/www/achei
git log --oneline -5            # achar a tag/commit bom (ex.: v1.20.1)
git checkout v1.20.1
npm ci && npm run build && pm2 restart achei
# voltar ao normal depois: git checkout main
```

## 7. Lições aprendidas (resumo)

1. **Olhe a placa do prompt** antes de colar comando (PC × servidor).
2. **Chave SSH nunca dentro de repositório** — sempre `~/.ssh` (o Git é cego pra fora do repo).
3. **Copiar/colar de chat corrompe URLs** (linkificação) — conferir arquivos com `grep`.
4. **Firewall: liberar o SSH ANTES de ligar o muro.**
5. **Hospedagem compartilhada tem tetos invisíveis** — `ulimit` alto não significa recursos disponíveis (CloudLinux/LVE corta antes).
6. **Health check que toca o banco** (`/api/health`) vale mais que monitorar a home (cache mente).
7. **O VPS deve ser descartável**: código no GitHub, segredos reconstruíveis, dados fora.
8. **Certificado só nasce com o DNS apontando certo** — se tentou antes, `systemctl restart caddy`.

---
*Migração executada por Álvaro (primeira vez administrando um servidor Linux!) com orientação passo a passo do Claude. Do 503 em loop ao cadeado verde: uma noite.* 🌿
