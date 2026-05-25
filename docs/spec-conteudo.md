# Spec — Conteúdo: Promoções, Notícias e Eventos

> Status: **aprovado — em construção**
>
> ## Decisões (definidas com o Álvaro)
> 1. **Notícias e Eventos SEPARADOS** (modelos distintos). Notícia = informa/
>    acontecimento (não convoca presença). Evento = convoca participação (tem
>    data/local).
> 2. **Promoções = opção B:** produto ganha `promoPriceCents` opcional + selo
>    "Oferta"; a aba `/promocoes` mostra **só os produtos em promoção**. A vitrine
>    completa continua no perfil.
> 3. **Permissões:** Notícias = **só admin**. Eventos = **o próprio anunciante**
>    cria, com **moderação do admin** (fica PENDENTE → admin aprova ou rejeita
>    com observação para ajuste). Admin também revisa erros.

> Objetivo: adicionar 3 abas no topo do site (Promoções, Notícias, Eventos),
> transformando o guia em mídia local viva — mais tráfego (Marina), mais valor
> pro lojista (Roberto), mais SEO.

---

## 1. Navegação (topo, fonte serif)

Antes de "Entrar"/"Anunciar", no header público:
**Promoções · Notícias · Eventos** — na mesma fonte serif (Playfair).

- Desktop: links inline.
- **Mobile:** não cabe tudo → menu "hambúrguer" com as abas + Entrar/Anunciar.
  (melhoria necessária — hoje o header já está apertado no celular).

---

## 2. NOTÍCIAS  (`/noticias`)

**Layout estilo G1:**
- 1 **notícia destaque** no topo (banner grande, imagem + título sobreposto).
- Abaixo, **2 notícias** lado a lado (cards médios).
- Abaixo, **lista das 5 mais recentes** (linhas com thumb + título + data).
- Link **"Mais notícias"** → arquivo paginado (`/noticias/arquivo`).

**Página da notícia** (`/noticias/[slug]`) — estilo portal:
- Capa grande, título (serif), linha de meta (data, autor), corpo do texto,
  e ao final "Veja também" (3 relacionadas).
- SEO: URL própria, Open Graph image, JSON-LD `NewsArticle`.

**Cadastro:** no admin (`/dashboard/admin/conteudo`).
- Pode ser **liberado para um lojista** (ele cria notícias do próprio negócio).

---

## 3. EVENTOS  (`/eventos`)

Mesma estrutura visual das Notícias:
- 1 evento destaque em cima, 2 abaixo, lista com "Mais eventos".
- **Campos extras de evento:** data/hora, local, link de inscrição (opcional).
- **Página do evento** (`/eventos/[slug]`): capa, título, **data + local em destaque**,
  descrição, botão "Como chegar" (se tiver endereço) e "Quero ir" (compartilhar).
- SEO: JSON-LD `Event` (aparece bonito no Google).
- **Auto-arquivamento:** quando a data passa, o evento sai do destaque e vai
  para "Eventos encerrados".

---

## 4. PROMOÇÕES  (`/promocoes`)

**Vitrine global** — todos os produtos de todos os lojistas, estilo e-commerce:
- Grade de cards: **imagem, nome da loja, preço, descrição curta**.
- Clicar → abre o produto (modal) com botão "Comprar pelo WhatsApp".
- Filtros: por categoria de negócio, ordenação (preço), e busca.
- Os mesmos produtos aparecem **no perfil do anunciante** (vitrine) e aqui.

> **Ponto de discussão (importante):** "Promoções" listando *todos* os produtos
> pode soar estranho (nem todo produto é promoção). Ver melhoria #2 abaixo.

---

## 5. Modelo de dados (proposta)

**Unificar Notícias + Eventos num só modelo `Post`** (mesma estrutura, menos
código, um único admin):

```prisma
model Post {
  id          String     @id @default(cuid())
  kind        PostKind                  // NEWS | EVENT
  title       String
  slug        String     @unique
  excerpt     String?    @db.Text        // resumo (lista/cards)
  content     String     @db.Text        // corpo (markdown simples)
  coverUrl    String?    @db.Text        // imagem de capa (Cloudinary)
  status      PostStatus @default(DRAFT) // DRAFT | PUBLISHED
  featured    Boolean    @default(false) // destaque grande
  publishedAt DateTime?
  authorId    String                     // quem criou (admin ou lojista)
  businessId  String?                    // se for de um lojista
  // campos de evento (nulos em notícias):
  eventDate     DateTime?
  eventLocation String?
  eventUrl      String?    @db.Text
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  @@index([kind, status, publishedAt])
}
enum PostKind   { NEWS EVENT }
enum PostStatus { DRAFT PUBLISHED }
```

Promoções **não precisam de modelo novo** — reutilizam `Product` (já existe).

**Permissão de publicar:** flag `canPublish Boolean @default(false)` no `Business`
(admin liga pra lojistas escolhidos) — ver melhoria #4.

---

## 6. Admin / publicação

- `/dashboard/admin/conteudo`: lista de posts (filtro Notícias/Eventos),
  criar/editar/publicar, marcar destaque, upload de capa, escrever conteúdo.
- Lojista com permissão: vê só os posts do próprio negócio, mesmo editor.
- Toda publicação registra AuditLog; admin pode despublicar.

---

## 7. Minhas sugestões de melhoria (pra discutir)

1. **Unificar Notícias+Eventos** num modelo `Post` (acima) — 1 admin, 1 template,
   metade do código. (recomendo forte)

2. **Repensar "Promoções":** se listar *todos* os produtos, o nome engana.
   Duas opções:
   - **(A) Renomear a aba** para "Vitrine" ou "Achadinhos" (mostra tudo).
   - **(B) Manter "Promoções"** e adicionar ao `Product` um preço promocional
     opcional (`promoPriceCents`) + selo "Oferta"; a aba mostra **só os produtos
     em promoção** (e a "Vitrine" completa fica no perfil). → isso vira um
     **ímã de caça-ofertas** (mais tráfego) e dá um motivo a mais pro lojista.
   - *Minha recomendação:* (B) — promoção de verdade gera mais venda e tráfego.

3. **Conteúdo na home:** mostrar os últimos (1 notícia + 1 evento + 3 promoções)
   na homepage também, não só nas abas — aumenta descoberta.

4. **Publicar = perk do Premium:** lojista só posta notícias/eventos do negócio
   se for **Premium** (ou liberado manualmente). Vira mais um motivo pra assinar.

5. **Editor simples primeiro:** título + capa + parágrafos (markdown leve),
   não um WYSIWYG completo (complexo). Evolui depois se precisar.

6. **SEO é o grande ganho:** cada notícia/evento é uma página indexável com
   conteúdo fresco — o Google adora. JSON-LD `NewsArticle`/`Event`.

7. **Moderação:** se lojistas publicam, admin revisa/despublica; talvez um
   status "EM REVISÃO" antes de ir ao ar.

---

## 8. Esforço (estimativa)
- Modelo Post + admin CRUD + permissão: médio
- Páginas públicas (notícias, eventos + artigos): médio
- Promoções (vitrine global + filtros): pequeno (reutiliza Product)
- Nav + menu mobile: pequeno
- Total: 2–3 sessões, incremental (dá pra ir por aba).
