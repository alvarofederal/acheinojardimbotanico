# Changelog — Achei no Jardim Botânico

Todas as mudanças relevantes do projeto. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/) e versionamento [SemVer](https://semver.org/lang/pt-BR/).

> **Como ler:** `MAJOR.MINOR.PATCH` — PATCH = correção/ajuste pequeno · MINOR = marco/feature · MAJOR = grande marco/reescrita.
> Marque `(inclui migration)` nas versões que mexeram no banco. Veja o fluxo em `CLAUDE.md → Versionamento & Release`.

---

## [1.19.3] - 2026-06-11 — Resiliência de boot e configuração
- `AUTH_URL` canônica definida no código em produção (corrige o login Google sem depender de variável no painel do host)
- Validação de env no boot (`src/instrumentation.ts`): log claro do que falta/está malformado — fim do "morreu sem log"
- `/api/health`: endpoint de saúde (app + banco) para o UptimeRobot

## [1.19.2] - 2026-06-11 — Hotfix P0: crash loop em produção (PANIC do Prisma)
- Batimento de presença 12s → 60s (5× menos carga) e janela "online agora" 30s → 150s
- Era a query mais frequente do sistema e o gatilho estatístico do `PANIC: timer has gone away` do query engine (Prisma 5.17 + fork do Passenger/Hostinger) que derrubava o app em loop (503)
- Correção de raiz proposta: upgrade Prisma 5.17 → 5.22 (deploy separado)

## [1.19.1] - 2026-06-07 — Gabarito de corte no cartão
- Folha A4 com **marcas de corte nos 4 cantos de cada cartão** (corte individual, reto)
- Espaço entre os cartões (gutter 6mm) + marcas mais visíveis (0.4mm)

## [1.19.0] - 2026-06-07 — Logo curada no cartão (inclui migration)
- **Logo da empresa no cartão/display:** upload curado pelo admin no "Editar" de Negócios → Cloudinary em alta qualidade
- Cartão e display **priorizam a logo** (tile branco, sem cortar) → capa do lojista → 1ª foto
- Alta qualidade na impressão (recorte/qualidade no delivery do Cloudinary)
- Impressão do cartão **espera a imagem carregar** (não sai mais sem logo)
- Lista de Negócios e hub de Cartões: thumbnail + **luz verde/vermelha** (tem logo / sem logo)
- **Banco:** coluna `Business.logoUrl` (aditiva) + **Prisma Migrate baselinado** (`0_init`) em dev e prod

## [1.18.0] - 2026-06-05 — Favoritos & experiência
- Favoritos da população (coração nos cards, cookie/localStorage, máx. 3)
- Novo hero da home: "Achou?" + "Achei no Jardim Botânico" (SVG responsivo, 1 linha)
- Hub de Cartões e Hub de Displays no admin (busca qualquer negócio + impressão A4)
- Cartão de visita redesenhado (nome dinâmico em 1 linha, sem categoria)
- Link curto liberado para todos os planos + edição pelo admin (Negócios/Usuários)
- Edição do negócio (slug + status num só modal) e status do negócio na edição do usuário
- Correções de segurança (patch de vulnerabilidades Node)
- **Versionador:** versão no rodapé + CHANGELOG + processo de release no CLAUDE.md

## [1.17.0] - 2026-06-03 — Produção & LGPD
- Script de migração dev→prod + runbook de lançamento
- Ativar/desativar negócio (LGPD) com cascata para o usuário
- PIX dinâmico (QR + copia-e-cola) com o valor exato
- Gerador de cartão de visita (9×5 cm) — Achei (admin) + lojista
- Card de visitantes com total acumulado (só cresce) + hoje/7d/30d
- Remoção do login GitHub + alinhamento de URL

## [1.16.0] - 2026-06-02 — Display & Segurança
- Gerador de display A6 por loja (QR para o perfil) + CRUD de usuários
- Ajustes do display (avatar da loja, cores no PDF, nome do arquivo)
- Hardening: remoção de jspdf/jsqr/twilio (vulnerabilidades) + webhook fail-closed
- Card "Onde as pessoas te encontram" (findability)

## [1.15.0] - 2026-06-01 — Identidade de marca
- SiteLogo unificada + favicon AJBT
- logo-icon 512×512 para WhatsApp/Instagram
- Link do Instagram com ícone no rodapé

## [1.14.0] - 2026-05-29 — Verificação de claim
- Verificação de e-mail no fluxo de reivindicação
- Campo nome no cadastro
- Melhorias na tela de usuários

## [1.13.0] - 2026-05-27 — Custo & Confiança
- Fotos migram do Google para o Cloudinary (corta custo, esconde a chave)
- Notificações: sininho no topo + badges no menu
- Verificação de propriedade pelo telefone oficial do negócio

## [1.12.0] - 2026-05-26 — Ativação & Vendas
- Cortesia/Trial gratuito sem furar a contabilidade
- "Online agora" quase em tempo real (janela 30s)
- Tela de Prospecção + tema claro por padrão
- Painel de atividade por negócio (follow-up de vendas)

## [1.11.0] - 2026-05-26 — Loja & Slug
- Slug curto personalizável + métricas reais no painel admin
- Menu mobile via portal + telas mais distribuídas
- Botões "Ver loja" na listagem e no perfil
- Kit de prospecção (pitches com alvos reais)

## [1.10.0] - 2026-05-25 — Conversão
- Mapa interativo do local (OpenStreetMap, sem chave/custo)
- Cadastro de negócio novo com autocomplete de endereço
- Onboarding "complete seu perfil" na home do anunciante
- Redesign "uau" da loja + personalização pelo lojista
- Rate-limit em verify-email/reset-password/geocode + sitemap completo

## [1.9.0] - 2026-05-25 — Planos configuráveis
- Camada PlanConfig (preço, limites e feature flags)
- Tela admin Planos & Cobrança + gates de recurso por plano
- Expiração automática de plano via cron
- Dashboard de receita + histórico em pagamentos

## [1.8.0] - 2026-05-25 — Conteúdo
- Plano Free + expiração automática
- Promoções (preço promocional + aba /promocoes)
- Notícias (admin) + Eventos (anunciante + moderação)

## [1.7.0] - 2026-05-24 — Monetização & Vitrine
- Pagamento manual (PIX / Mercado Pago)
- Vitrine de produtos
- Preços dos planos configuráveis pelo admin
- Lightbox nas fotos + página de loja dedicada

## [1.6.0] - 2026-05-24 — Custos & Cobertura
- Painel de custos da API Google
- Proxy de fotos com cache (esconde a chave, corta custo)
- Varredura ampla de tipos (+50 categorias)
- Dashboard de ROI do anunciante (/dashboard/metricas)

## [1.5.0] - 2026-05-23 — Home cinematográfica
- Home cinematográfica + tela do negócio ampliada
- Avaliações do Google + Open Graph dinâmico (next/og)
- Skeletons de loading + acessibilidade (foco visível)
- Landing de vendas (/anuncie) + analytics

## [1.4.0] - 2026-05-23 — Flora Design System
- Redesign completo (Flora Design System) + busca

## [1.3.0] - 2026-05-23 — SEO, Asaas & LGPD
- SEO (sitemap/robots) + homepage com browse por categoria
- E-mails de claim (Resend)
- Upload de fotos do anunciante com limites por plano (Spec 006)
- Integração Asaas — PIX/cartão/boleto (Spec 008)
- Filtros na listagem + reset de senha
- Audit log (admin) + exclusão LGPD + página 404 com identidade

## [1.2.0] - 2026-05-22 — Plataforma base
- Specs 002–007: páginas públicas, painel do anunciante e admin

## [1.1.0] - 2026-05-22 — Importação
- Spec 001: importação via Google Places

## [1.0.0] - 2026-05-21 — Gênese
- Base do Courtesyfy limpa e adaptada para o Achei
- Schema do Achei aplicado + codebase alinhado
