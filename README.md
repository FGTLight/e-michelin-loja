# E Michelin e Cia — Loja virtual

Loja online de materiais de construção e hidráulica da **E Michelin e Cia** (Distrito Federal, 509 – Centro, Erechim/RS).

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · GSAP + ScrollTrigger · Supabase (Postgres, Auth, Storage, RLS) · Mercado Pago (Pix, cartão, boleto) · Zustand · React Hook Form + Zod · Resend · Recharts.

---

## 1. Rodando em 2 minutos (modo demonstração)

Sem nenhuma variável de ambiente a loja sobe em **modo demonstração**: o catálogo de exemplo (39 produtos) é lido de `src/data/catalog.ts` e você navega por home, catálogo, busca, produto, carrinho, calculadora, orçamento e checkout. Gravar pedidos, login e painel exigem o Supabase.

```bash
npm install
npm run dev          # http://localhost:3000
```

> Requer **Node.js 20+** (os scripts de dados usam Node 22.18+, que executa TypeScript nativamente).

## 2. Configuração completa

### 2.1 Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (região **São Paulo**).
2. No **SQL Editor**, execute nesta ordem:
   - `supabase/schema.sql` — tabelas, tipos, funções, gatilhos, **RLS** e bucket de imagens.
   - `supabase/seed.sql` — categorias, marcas, 39 produtos com preços reais de mercado, zonas de entrega de Erechim e região, cupons e banner.
3. **Authentication → URL Configuration**: `Site URL` = sua URL e adicione `https://SEU-DOMINIO/auth/callback` em *Redirect URLs*.
4. Crie sua conta pelo site (`/entrar`) e promova-a a administrador no SQL Editor:
   ```sql
   update public.users set role = 'admin' where email = 'voce@empresa.com.br';
   ```
5. Copie `.env.example` para `.env.local` e preencha URL, anon key e service role key.

### 2.2 Mercado Pago

1. Em *Suas integrações*, crie uma aplicação (Checkout Transparente / Pagamentos online).
2. Use as **credenciais de teste** em desenvolvimento (`NEXT_PUBLIC_MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`).
3. Em **Webhooks**, cadastre `https://SEU-DOMINIO/api/webhooks/mercadopago` com o evento **Pagamentos** e copie a *assinatura secreta* para `MP_WEBHOOK_SECRET`.
4. Configure o **parcelamento sem juros** na conta do Mercado Pago (o site oferece até 10x, parcela mínima de R$ 50 — ajustável em `src/config/site.ts`).

Sem credenciais do MP (e fora de produção) os pagamentos são **simulados**: o Pix gera um código fictício e o botão *“Simular pagamento aprovado (dev)”* aprova o pedido, disparando o mesmo fluxo do webhook.

### 2.3 E-mails (Resend) e WhatsApp

- `RESEND_API_KEY` + `EMAIL_FROM` com domínio verificado no Resend. Sem chave, os e-mails aparecem apenas no log do servidor.
- WhatsApp automático via **WhatsApp Cloud API** (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`). Atenção: fora da janela de 24h a Meta só entrega **mensagens de template aprovadas** — para produção, crie templates para “status do pedido” e “orçamento pronto” e adapte `sendWhatsApp` em `src/lib/notifications.ts`. Sem credenciais, as mensagens vão para o log e o painel oferece botões `wa.me` para contato manual.

### 2.4 Dados da loja a confirmar ⚠️

Os campos abaixo estão com **placeholders** e precisam ser confirmados com a E Michelin antes do lançamento (`src/config/site.ts` / variáveis `NEXT_PUBLIC_*`):

| Campo | Onde |
|---|---|
| WhatsApp, e-mail, CNPJ, razão social | `.env` + `site.ts` |
| Horário de funcionamento | `site.ts → hours` |
| Instagram / Facebook | `.env` |
| Ano de fundação e números (clientes, itens) usados nos contadores | `NEXT_PUBLIC_FOUNDED_YEAR`, `site.ts → stats` |
| Cidades atendidas e tarifas de frete | Painel → Zonas de entrega |
| Textos das políticas (trocas, privacidade, termos) | `src/app/(loja)/politicas/[slug]/page.tsx` — revisar com o jurídico |
| Logos das marcas | Painel → Marcas (`logo_url`), use os arquivos oficiais autorizados |
| Fotos dos produtos | Painel → Produtos (as ilustrações SVG são só para teste) |

## 3. Deploy (Vercel + Supabase)

1. Suba o repositório no GitHub e importe na [Vercel](https://vercel.com/new) (framework detectado automaticamente).
2. Cadastre **todas** as variáveis do `.env.example` em *Settings → Environment Variables* (`NEXT_PUBLIC_SITE_URL` = domínio final).
3. Deploy. Depois, atualize no Supabase o *Site URL/Redirect URLs* e no Mercado Pago a URL do webhook.
4. Domínio próprio em *Vercel → Domains*; envie `https://SEU-DOMINIO/sitemap.xml` ao Google Search Console.
5. Recomendado: ativar *Point-in-time recovery* e backups no Supabase e trocar para credenciais de **produção** do Mercado Pago.

## 4. Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:seed:generate` | Regenera `supabase/seed.sql` a partir de `src/data/catalog.ts` |
| `npm run images:generate` | Regenera as ilustrações SVG de exemplo em `public/images/produtos` |

## 5. Estrutura

```
supabase/
  schema.sql            Tabelas, enums, funções (reserva de estoque, cupom, busca), gatilhos e RLS
  seed.sql              Dados de exemplo (gerado)
scripts/                Geradores de seed e imagens
src/
  app/
    (loja)/             Vitrine: home, produtos, produto/[slug] (SSG+ISR), checkout, pedido/[token],
                        orcamento, favoritos, entrar, conta/*, politicas/[slug]
    admin/              Painel: dashboard, pedidos, orçamentos, produtos (+importar), recursos/[recurso]
    api/                search, frete, cep, cupom, checkout, pagamentos, webhooks/mercadopago,
                        orcamentos, pedidos/[token], produtos, conta/dados, admin/*
    sitemap.ts · robots.ts · opengraph-image.tsx
  components/
    home/               Hero (GSAP), Categories, WeeklyDeals + Countdown, BestSellers,
                        MaterialCalculator, WhyUs, BrandsMarquee, Location
    layout/             Header, MegaMenu, SearchBar (autocomplete), Footer, WhatsAppButton, CookieConsent
    cart/               CartDrawer, FlyToCartLayer
    product/            ProductCard, ProductGallery, ProductDetail, ShippingEstimator, QuantitySelector…
    catalog/            CatalogShell (URL = estado dos filtros), Filters, SortSelect, Pagination
    checkout/           CheckoutWizard (4 etapas), PaymentPanel (Pix/cartão/boleto), QuoteForm
    account/            OrderTimeline, OrderSummary, AddressBook, RepeatOrderButton…
    admin/              DashboardCharts, ProductForm, ProductImporter, QuoteResponder, ResourceManager…
  lib/                  data (leitura do catálogo), orders, payments, mercadopago, notifications,
                        shipping, calculator, validators (Zod), seo (JSON-LD), supabase/*
  store/                Zustand: cart (persistente), wishlist, quote (lista de orçamento), ui
  data/catalog.ts       Fonte única dos dados de exemplo
```

## 6. Decisões de arquitetura

- **O servidor é a fonte da verdade.** O navegador envia apenas IDs e quantidades; preço, promoção, frete (cidade oficial do CEP via ViaCEP + peso do banco), cupom e total são recalculados no servidor (`src/lib/orders.ts`).
- **Estoque atômico.** `reserve_stock()` decrementa tudo-ou-nada dentro do Postgres; cancelar um pedido devolve o estoque via gatilho.
- **Pedido primeiro, cobrança depois.** O checkout cria o pedido (`aguardando_pagamento`) e redireciona para `/pedido/[token]`, onde a cobrança é gerada. O mesmo painel de pagamento serve para retomar um Pix expirado e para pagar orçamentos convertidos.
- **Webhook confiável:** assinatura HMAC `x-signature` validada (com janela anti-replay), o pagamento é **consultado na API do MP** (o corpo nunca é confiado), o valor é conferido com o total do pedido e a atualização é idempotente.
- **RLS em todas as tabelas.** Catálogo é público só para itens ativos; clientes leem apenas os próprios pedidos/endereços; cupons nunca são expostos; escrita no catálogo só para `admin/staff` (`is_admin()`), inclusive no bucket de imagens. A service role é usada apenas em rotas de servidor, após validação Zod.
- **Catálogo estático + ISR.** Home (5 min) e páginas de produto (1 h) são pré-renderizadas; salvar no painel chama `revalidatePath` para refletir na hora.
- **Busca:** coluna `tsvector` gerada (português + `unaccent`) com índice GIN, e `search_products()` combina prefixo full-text + trigram (tolerante a acentos e erros de digitação). Para catálogos muito grandes, o ponto de troca para Meilisearch é `/api/search`.
- **Lista de desejos** e **lista de orçamento** ficam no navegador (Zustand persistido) — não exigem login.

## 7. Qualidade

| Requisito | Como foi atendido |
|---|---|
| SEO | Title padrão “Material de Construção em Erechim \| E Michelin e Cia”, metadata por página, Open Graph dinâmico, `sitemap.xml`, `robots.txt`, JSON-LD `HardwareStore`/`LocalBusiness`, `Product` (preço, disponibilidade, política de devolução) e `BreadcrumbList` |
| Performance | SSG/ISR, `next/image` (AVIF/WebP), fontes `next/font`, mapa carregado sob demanda, SDK do Mercado Pago e leitores de planilha carregados só quando usados, animações apenas com `transform/opacity` |
| Acessibilidade | Contraste AA (laranja com texto petróleo-950), foco visível, “pular para o conteúdo”, combobox ARIA na busca, diálogos com foco preso e `Esc`, labels/erros associados, tabelas alternativas nos gráficos |
| Movimento | `MotionConfig reducedMotion="user"`, `gsap.matchMedia` (casa já pronta e sem pin), CSS global zera animações com `prefers-reduced-motion` |
| Segurança | Zod no servidor, RLS, webhook assinado, rate limit nas rotas públicas, honeypot no orçamento, headers de segurança, proteção contra open redirect e CSV injection |
| LGPD | Banner de cookies (só essenciais por padrão), consentimento explícito no checkout/orçamento, opt-in de marketing separado, exportação e exclusão de dados em *Minha conta* |
| CDC | Direito de arrependimento de 7 dias destacado (rodapé, e-mails, política e contador no pedido entregue) |

> O rate limit incluído é em memória (por instância). Em produção na Vercel, troque por Upstash Redis/Vercel KV.

## 8. Cupons de teste (seed)

`BEMVINDO10` (10% acima de R$ 200) · `OBRA50` (R$ 50 acima de R$ 1.000) · `FRETEGRATIS` (acima de R$ 300).
