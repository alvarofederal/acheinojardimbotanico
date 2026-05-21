# Constitution — Achei no Jardim Botânico

> Princípios invioláveis do projeto. Toda decisão técnica e de produto passa por aqui antes de ser executada. Em caso de conflito entre um princípio e uma "boa prática genérica", os princípios ganham.

---

## Princípio 0 — Simplicidade radical (o filtro mestre)

Simplicidade radical vence boa prática genérica. Toda feature, abstração ou lib passa pelo teste: **"isso resolve a dor do Roberto hoje?"**. Se não resolve, sai. Sem exceções por "mas é melhor prática", "mas vai escalar", "mas fica mais elegante".

**Corolário:** Cada hora investida em complexidade desnecessária é uma hora que o operador (Álvaro, CLT, 1h/dia) não tem. Complexidade desnecessária é custo real, não débito técnico abstrato.

---

## Princípio 1 — Mobile-first, sempre

Se quebrar em mobile, não está pronto. Nenhuma feature é considerada entregue sem ter sido testada num viewport de 375px. O usuário primário (Marina) usa o celular em movimento.

---

## Princípio 2 — SEO local é vantagem competitiva, não nice-to-have

Toda página pública tem:
- `<title>` e `<meta description>` otimizados para busca local
- JSON-LD `LocalBusiness` com dados estruturados
- Entry no sitemap
- Open Graph para compartilhamento social

Sem SEO, Marina não chega. Sem Marina chegando, Roberto não vê valor. O negócio inteiro depende disso.

---

## Princípio 3 — Privacidade por padrão

LGPD compliance é não-negociável:
- Dados pessoais ao mínimo (email + nome do anunciante, nada mais)
- Consentimento explícito na reivindicação (checkbox Termos + Política)
- Rota `/api/lgpd/delete-my-data` funcional
- Senha: bcrypt custo 12 mínimo, nunca em log
- Secrets nunca no código, sempre `.env`

---

## Princípio 4 — Performance importa (LCP < 2s em 3G)

Meta: LCP < 2s em conexão 3G. Sem isso, descoberta espontânea morre antes de começar.
- ISR para páginas públicas (revalidação 1h)
- Cache de Places API no banco (não chamar Google a cada page view)
- `next/image` para todas as imagens
- Lazy loading em listas longas

---

## Princípio 5 — Reversibilidade

Nenhuma operação destrutiva sem backup e confirmação explícita do operador. Toda ação administrativa é logada em `AuditLog`. Migrações destrutivas não acontecem sem `-- aceita que pode perder dados?` no chat.

---

## Princípio 6 — Acessibilidade (WCAG 2.1 AA)

Meta WCAG 2.1 AA. Não é caridade — é mercado. Idosos compram local; a dona da padaria tem 60 anos. Contraste mínimo 4.5:1, navegação por teclado, `alt` em imagens, labels em formulários.

---

## Princípio 7 — Spec antes do código

Se a spec não está clara, não codifica. O fluxo é:
`spec.md → plan.md → tasks.md → implementação`

Se a implementação divergir da spec, a spec é atualizada *antes* do PR ser aberto. Código sem spec correspondente vira débito de documentação imediato.

---

## Princípio 8 — Dependência mínima

Cada lib adicionada precisa de justificativa registrada (ADR ou comentário no PR). Pergunta obrigatória: *"o que o Next.js / React / Prisma já faz isso nativamente?"*. Em caso de dúvida, não adiciona.

---

## Princípio 9 — Testes onde importam

Lógica de billing (Asaas webhook, mudança de plano) e integração Places API têm testes obrigatórios. UI pode pular — o custo de manter testes de componente num projeto solo supera o benefício no MVP.

---

## Princípio 10 — Curadoria humana é feature de primeira classe

O operador editar manualmente um negócio (nome, foto, descrição, categoria) é fluxo nobre, não exceção. O diferencial do Achei sobre o Google Maps é exatamente isso. O painel admin deve tornar essa tarefa rápida e agradável, não uma gambiarra de emergência.

---

*Criado em: 2026-05-21 | Baseado em spec.md Parte 10 + Princípio 0 adicionado pelo operador*
