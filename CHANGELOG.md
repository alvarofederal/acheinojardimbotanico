# Changelog — Achei no Jardim Botânico

Todas as mudanças relevantes do projeto. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/) e versionamento [SemVer](https://semver.org/lang/pt-BR/).

> **Como ler:** `MAJOR.MINOR.PATCH` — PATCH = correção/ajuste pequeno · MINOR = marco/feature · MAJOR = grande marco/reescrita.
> Marque `(inclui migration)` nas versões que mexeram no banco. Veja o fluxo em `CLAUDE.md → Versionamento & Release`.

---

## [1.24.6] - 2026-06-22 — CSP libera Google Analytics + fontes data:
- O CSP bloqueava o **gtag (Google Analytics)** e **fontes `data:`** em produção. Liberados: `script-src`/`connect-src`/`img-src` para `googletagmanager.com` + `google-analytics.com`; `font-src` ganhou `data:`.
- **Importante:** o crash de render (página "não segura") em `/[bairro]/[categoria]` e em perfis de negócio 24h **já estava corrigido nas 1.24.3–1.24.5** (a produção estava na 1.24.2). Este deploy sobe tudo junto e resolve o crash + o GA.

## [1.24.5] - 2026-06-20 — Radar Fantasma: prospecção de perfis abandonados [protótipo, admin]
- Nova tela admin `/dashboard/admin/radar` + item de menu "👻 Radar Fantasma".
- **Score de saúde 0–100** por negócio (`lib/health-score.ts`), calculado do que **já importamos** do Google (telefone, horário, fotos, descrição, site, Instagram, avaliações) — **custo zero**. Lista os mais abandonados = fila de prospecção.
- **Contadores 🔴/🟡/🟢 + Livres** (o "pé no chão": quantos estão de fato vivos), flag **🔥 "popular e largado"** (tem movimento mas o dono sumiu = melhor lead) e botão **WhatsApp com a abordagem pronta** (`buildGhostMessage` — tom de ajuda, sem alarme, sem prometer "ranquear no Google").

## [1.24.4] - 2026-06-19 — Hotfix: crash em negócio 24h (período sem `close`)
- **Bug (introduzido no 1.24.3):** a checagem da virada de madrugada acessava `p.close.day` em **todo** período, mas o Google **omite `close`** em negócios abertos 24h → `undefined` → `TypeError` que derrubava a **página de categoria inteira**.
- **Conserto:** `close` agora é opcional no tipo `OpeningPeriod`; período sem `close` = **"Aberto 24 horas"**; `getOpenStatus` e `toEditorModel` ignoram períodos malformados (sem `open`) em vez de quebrar.

## [1.24.3] - 2026-06-19 — "Aberto/Fechado agora" consistente (fuso de Brasília + ao vivo)
- **Bug:** o mesmo negócio mostrava status diferente no **perfil** vs no **card** da busca, na mesma hora. Causa dupla: (1) o perfil calculava no **servidor** (VPS em UTC, 3h a mais) e o card no **client** (hora local) — relógios diferentes; (2) o perfil tinha `revalidate=3600` (ISR), **congelando** o status por até 1h.
- **Conserto de raiz:** `lib/opening-hours` agora calcula **SEMPRE no fuso America/Sao_Paulo** (via `Intl`), rode onde rodar (VPS em UTC ou browser de qualquer fuso). O status do perfil virou **client-side ao vivo** (`OpenStatusPill`/`OpenStatusFact`), idêntico ao card. De quebra, corrigida a **virada de madrugada** (período que cruza a meia-noite, ex.: sex 22:00→sáb 02:00).

## [1.24.2] - 2026-06-19 — Trava anti-overflow horizontal (conserta "site ocupa metade" + imagem deslocada no mobile)
- **Causa raiz**: o projeto nunca teve trava de overflow horizontal. Bastava UM elemento vazar a largura pra, no mobile, o navegador "afastar o zoom" (o site ocupava metade da tela) **e** o `fixed inset-0` do modal medir a largura errada → imagem da galeria/vitrine ia pro canto. Os dois sintomas eram o mesmo bug.
- **Conserto estrutural**: `html, body { overflow-x: clip; max-width: 100% }` no globals. `clip` mata o scroll horizontal **sem** criar scroll-container, então o header `sticky` continua funcionando. Agora nenhum elemento solto consegue derrubar o layout mobile.

## [1.24.1] - 2026-06-19 — Correções mobile: galeria do perfil + popups de imagem
- **Galeria do perfil (mobile)**: a 1ª foto ocupava as 2 linhas do grid e empurrava as outras pra uma linha sem altura (`h:0`) → sumiam. Agora: 1 foto grande em cima + as demais embaixo, todas visíveis.
- **Popups de imagem (produto e galeria) via portal** (`document.body`): blindam contra ancestral com `transform`/`backdrop-filter` (o que jogava o `fixed` pro canto da tela). Agora sempre centralizam no mobile.

## [1.24.0] - 2026-06-19 — Horário de funcionamento (o lojista controla) + cards mobile + status na tag
- **Editor de horário no painel** (`/dashboard/negocio`): 7 dias no padrão Google, com **turnos divididos** (ex.: 09:00–13:00 e 14:00–18:00) e "copiar p/ seg–sex". O lojista controla — vale mais que o importado do Google.
- **Inteligência de feriado**: calendário **BR + DF calculado sozinho** (Carnaval, Sexta-Santa e Corpus Christi derivados da Páscoa; nacionais + regionais do DF). Em feriado o status mostra **"Feriado"** (informativo); se o lojista marcar "fecho em feriados", mostra **"Fechado"** — nunca "Fechado (feriado)".
- **Tag de status revisada**: Aberto / Fechado / Feriado / **"Horário não informado"** (antes a tag sumia pra quem não tinha horário cadastrado). Lógica única em `src/lib/opening-hours.ts` (fim da duplicação em 3 lugares).
- **Cards no mobile**: fundo verde + inicial **sempre** atrás da foto + `onError` → o card nunca mais aparece "quebrado" enquanto a imagem carrega (ou se falhar).
- **Perfil**: quadro da semana agora vem do horário **cadastrado pelo lojista** (fallback pro texto do Google) e destaca o dia de hoje.

## [1.23.2] - 2026-06-16 — Busca livre (/busca) no padrão UAU
- Página de **busca** (`/busca?q=`) no novo layout: banner verde (igual à listagem por categoria) com a barra de busca embutida + título "Resultados para …"
- Os cards agora calculam os **extras de plano** (selo, destaque, botão **"Ver loja"**) também na busca — antes não apareciam ali
- **Preservados**: número de avaliações e todos os botões do card (WhatsApp, Ver loja)
- Docs: `docs/vendas/dossie-crescimento-jbt.html` — dossiê de crescimento hiperlocal

## [1.23.1] - 2026-06-16 — Herói da /anuncie no padrão UAU
- Página **/anuncie**: herói cinematográfico igual à home — verde cobrindo a tela (100svh) + parallax (`HeroParallax`) + textura pontilhada (grain) + conteúdo centrado + scroll cue
- Resto da página inalterado (já no padrão Flora; planos puxam os preços reais do banco)
- Docs: `docs/vendas/playbook-porta-a-porta.html` — playbook de vendas porta a porta (HTML/PDF imprimível)

## [1.23.0] - 2026-06-15 — Redesign UAU das telas públicas + visibilidade de funcionalidades (inclui migration)
- **Redesign nível Designer Sênior** das telas públicas (padrão do estudo `docs/design/hero-uau.html`):
  - **Home**: herói verde cobrindo a tela inteira (100svh) com **navbar transparente** que congela em verde fosco ao rolar; **parallax** de folhas/brilhos (mouse + scroll); textura **pontilhada** (grain); **joias** em cards editoriais 4:5 que revelam ao passar o mouse (avaliações + WhatsApp); **favoritos** no mesmo idioma
  - **Perfil do lojista**: herói cinematográfico com capa, barra de ação em vidro, seções com kicker + título e "aberto agora"
  - **Resultado de busca**: banner da categoria (ícone + média) + barra de filtro **fixa** com contagem ao vivo
  - **Chrome global**: navbar verde + dourado, **footer verde**, busca de vidro + dourado, logo em variante clara
- **Visibilidade de funcionalidades** (Promoções/Notícias/Eventos/Vagas): cada seção aparece no site **só** quando a chave manual está ON **e** há ≥1 conteúdo publicado; **nasce desligada**; oculto vira **404 + sai do sitemap**; toggle no admin (Pagamentos)
- Migration aditiva: `site_config` (tabela `SiteConfig`)
- ⚠️ As seções sobem **invisíveis** — ativar no admin quando houver conteúdo

## [1.22.0] - 2026-06-14 — Sistema de Vagas + impressão A5 do display (inclui migration)
- **Vagas**: anunciante reivindicado publica vagas (CRUD em `/dashboard/vagas`), limite por plano (**5** Visibilidade / **10** Premium); liberação por plano no admin (toggle "Vagas" + limite)
- Página pública **`/vagas`** (cards pequenos clicáveis) + detalhe **`/vagas/[id]`** com a descrição completa
- Candidatura por **WhatsApp** e/ou **e-mail** (botão que copia o endereço), escolhível por vaga
- Link **"Vagas"** no navbar e no rodapé; botão "Vagas" no perfil (só negócio reivindicado e com vaga ativa)
- **Impressão do display em A5**: o A6 sai girado ocupando metade da folha → **2 displays por folha** (vira 180° e reimprime), zero desperdício
- Migrations aditivas: `add_vagas`, `vaga_email_contato`
- ⚠️ Vagas sobe **desligada** — ativar no admin (Pagamentos), por plano

## [1.21.3] - 2026-06-12 — Google Analytics 4 ativo
- GA4 (`G-SXDHG23V5B`) ligado em produção (o código já existia; faltava o ID)
- Ativa **só em produção** (`NODE_ENV`) — dev/localhost não polui mais as métricas
- `NEXT_PUBLIC_GA_ID` continua sobrepondo o padrão, se quiser trocar sem mexer no código

## [1.21.2] - 2026-06-12 — Limpeza dos resíduos da Vercel
- Removidos `@vercel/analytics` e `@vercel/speed-insights` (carregavam `/_vercel/*` que dá 404 fora da Vercel — erros no console)
- `vercel.json` removido; o **cron de expiração de planos** migrou para `scripts/cron-expirar-planos.sh` (instalar no crontab do VPS)
- Google Analytics (o analytics real) inalterado

## [1.21.1] - 2026-06-12 — Ajuste do gate de segurança da CI
- Auditoria da esteira escopada a **dependências de produção** (`npm audit --omit=dev`):
  vulnerabilidade em ferramenta de teste/build (Cypress, tmp…) não bloqueia mais o deploy
- `npm audit fix`: removida a vulnerabilidade ALTA (`tmp`, dev-only); produção limpa de alta/crítica

## [1.21.0] - 2026-06-11 — Esteira CI/CD + documentação da migração VPS
- **Esteira GitHub Actions** (`.github/workflows/deploy.yml`): push na main → auditoria de
  segurança (`npm audit`) + testes unitários → deploy via SSH no VPS (pull, ci, migrate
  deploy, build, pm2 restart) → health check público. Build quebrado nunca derruba produção.
- **Primeiros testes unitários reais** (`tests/unit`): PIX BR Code (pagamento) e slugify (SEO/QR)
- **Runbook completo da migração VPS** (`docs/infra/migracao-vps.md`) — passo a passo, operação
  diária, rollback e lições aprendidas (pronto pra PDF)
- **ADR 0007**: registro arquitetural da migração shared → VPS + nota de atualização no spec.md

## [1.20.1] - 2026-06-11 — Selo verde no rodapé
- Selo "Hospedado com 100% de energia renovável" (folha Flora) no rodapé público —
  fiel ao claim do data center (alimentado/compensado por energia renovável)

## [1.20.0] - 2026-06-11 — Cadência de vendas + Gates da Rede
- **Prospecção com cadência D0 → D+3 → D+7:** badge de estágio por negócio, mensagem
  certa por toque (apresentação → prova → escassez), filtro "Follow-up vencido",
  contador de vencidos e reset de ciclo — o ritual de 20 min num só lugar
- **Card "Rumo à Rede"** na visão geral do admin: os 3 Gates com progresso real
  (pagantes sem cortesia) — o lembrete visual da tese
- **Auditoria & Histórico mesclados:** uma tela só com abas (Tudo | Ações com lojistas);
  /historico redireciona; menu admin mais limpo

## [1.19.4] - 2026-06-11 — Cura do PANIC: Prisma 5.22 + motor binário
- Upgrade Prisma 5.17.0 → 5.22.0 (sem mudança de schema/banco — zero toque em dados)
- `engineType = "binary"`: o query engine vira processo separado, imune ao fork do
  Passenger/Hostinger que matava o motor embutido ("PANIC: timer has gone away" → 503)
- Rollback: tag v1.19.3

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
