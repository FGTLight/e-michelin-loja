-- =============================================================================
-- E Michelin e Cia — Esquema do banco (Supabase / PostgreSQL 15+)
-- Execute no SQL Editor do Supabase (ou `supabase db push`) ANTES do seed.sql.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.user_role       as enum ('customer', 'staff', 'admin');
  create type public.person_type     as enum ('PF', 'PJ');
  create type public.sale_unit       as enum ('un', 'm', 'm2', 'm3', 'saco', 'caixa', 'barra', 'lata', 'rolo', 'kg', 'milheiro');
  create type public.order_status    as enum ('aguardando_pagamento', 'pago', 'em_separacao', 'saiu_para_entrega', 'entregue', 'cancelado');
  create type public.delivery_method as enum ('entrega', 'retirada');
  create type public.payment_method  as enum ('pix', 'cartao', 'boleto');
  create type public.payment_status  as enum ('pending', 'approved', 'authorized', 'in_process', 'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back');
  create type public.quote_status    as enum ('novo', 'em_analise', 'respondido', 'convertido', 'recusado', 'expirado');
  create type public.coupon_type     as enum ('percentual', 'valor_fixo', 'frete_gratis');
exception when duplicate_object then null; end $$;

-- unaccent() não é IMMUTABLE; este wrapper permite usá-lo em colunas geradas e índices.
create or replace function public.f_unaccent(text)
returns text language sql immutable parallel safe strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

-- -----------------------------------------------------------------------------
-- Usuários e clientes
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now()
);

create table if not exists public.customers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references public.users (id) on delete set null,
  person_type         public.person_type not null default 'PF',
  name                text not null,
  email               text not null,
  phone               text,
  cpf                 text,
  cnpj                text,
  company_name        text,
  state_registration  text,
  marketing_opt_in    boolean not null default false,
  lgpd_consent_at     timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint customers_document_chk check (
    (person_type = 'PF' and cpf is not null) or (person_type = 'PJ' and cnpj is not null)
  )
);
create index if not exists customers_email_idx on public.customers (lower(email));

create table if not exists public.addresses (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id) on delete cascade,
  label        text not null default 'Casa',
  recipient    text,
  cep          text not null check (cep ~ '^\d{8}$'),
  street       text not null,
  number       text not null,
  complement   text,
  district     text not null,
  city         text not null,
  state        char(2) not null,
  reference    text,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists addresses_customer_idx on public.addresses (customer_id);

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  icon         text,
  parent_id    uuid references public.categories (id) on delete set null,
  sort_order   int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  logo_url    text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  sku                text not null unique,
  slug               text not null unique,
  name               text not null,
  short_description  text,
  description        text,
  category_id        uuid references public.categories (id) on delete set null,
  brand_id           uuid references public.brands (id) on delete set null,
  price              numeric(12,2) not null check (price > 0),
  promo_price        numeric(12,2) check (promo_price is null or (promo_price > 0)),
  promo_ends_at      timestamptz,
  unit               public.sale_unit not null default 'un',
  unit_label         text,                       -- ex.: "saco 50 kg", "barra 6 m"
  min_qty            numeric(12,3) not null default 1 check (min_qty > 0),
  qty_step           numeric(12,3) not null default 1 check (qty_step > 0),
  stock              numeric(12,3) not null default 0 check (stock >= 0),
  min_stock          numeric(12,3) not null default 5,
  weight_kg          numeric(10,3) not null default 0,
  length_cm          numeric(10,2),
  width_cm           numeric(10,2),
  height_cm          numeric(10,2),
  specs              jsonb not null default '{}'::jsonb,
  is_featured        boolean not null default false,
  is_active          boolean not null default true,
  sold_count         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  search_vector      tsvector generated always as (
    setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(name, ''))), 'A') ||
    setweight(to_tsvector('simple',     coalesce(sku, '')), 'A') ||
    setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(short_description, ''))), 'B') ||
    setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(description, ''))), 'C')
  ) stored,
  constraint products_promo_lt_price check (promo_price is null or promo_price < price)
);
create index if not exists products_search_idx   on public.products using gin (search_vector);
create index if not exists products_name_trgm    on public.products using gin (public.f_unaccent(name) extensions.gin_trgm_ops);
create index if not exists products_category_idx on public.products (category_id) where is_active;
create index if not exists products_brand_idx    on public.products (brand_id) where is_active;
create index if not exists products_price_idx    on public.products (price);
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,
  alt         text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);

-- -----------------------------------------------------------------------------
-- Entrega, cupons e banners
-- -----------------------------------------------------------------------------
create table if not exists public.delivery_zones (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  cities         text[] not null default '{}',
  state          char(2) not null default 'RS',
  base_price     numeric(10,2) not null default 0,
  price_per_kg   numeric(10,4) not null default 0,
  free_above     numeric(12,2),
  max_weight_kg  numeric(10,2),
  delivery_days  int not null default 1,
  sort_order     int not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique check (code = upper(code)),
  description      text,
  type             public.coupon_type not null,
  value            numeric(12,2) not null default 0,
  min_order_value  numeric(12,2) not null default 0,
  max_uses         int,
  used_count       int not null default 0,
  starts_at        timestamptz,
  ends_at          timestamptz,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.banners (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  image_url   text,
  link_url    text,
  cta_label   text,
  placement   text not null default 'ofertas',
  starts_at   timestamptz,
  ends_at     timestamptz,
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Pedidos e pagamentos
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  number             bigint generated always as identity (start with 1001) unique,
  public_token       uuid not null default gen_random_uuid() unique,
  customer_id        uuid references public.customers (id) on delete set null,
  user_id            uuid references public.users (id) on delete set null,
  status             public.order_status not null default 'aguardando_pagamento',
  delivery_method    public.delivery_method not null,
  delivery_zone_id   uuid references public.delivery_zones (id) on delete set null,
  shipping_address   jsonb,
  customer_snapshot  jsonb not null,
  payment_method     public.payment_method,
  subtotal           numeric(12,2) not null,
  discount           numeric(12,2) not null default 0,
  shipping_cost      numeric(12,2) not null default 0,
  total              numeric(12,2) not null check (total >= 0),
  coupon_id          uuid references public.coupons (id) on delete set null,
  coupon_code        text,
  notes              text,
  quote_id           uuid,
  estimated_days     int,
  paid_at            timestamptz,
  delivered_at       timestamptz,
  cancelled_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_user_idx     on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx   on public.orders (status, created_at desc);
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete set null,
  sku         text not null,
  name        text not null,
  unit        public.sale_unit not null,
  unit_price  numeric(12,2) not null,
  quantity    numeric(12,3) not null check (quantity > 0),
  total       numeric(12,2) generated always as (round(unit_price * quantity, 2)) stored
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

create table if not exists public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  note        text,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists order_status_history_idx on public.order_status_history (order_id, created_at);

create table if not exists public.payments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders (id) on delete cascade,
  provider              text not null default 'mercadopago',
  provider_payment_id   text unique,
  method                public.payment_method not null,
  status                public.payment_status not null default 'pending',
  status_detail         text,
  amount                numeric(12,2) not null,
  installments          int not null default 1,
  pix_qr_code           text,
  pix_qr_code_base64    text,
  boleto_url            text,
  boleto_barcode        text,
  expires_at            timestamptz,
  raw                   jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments (order_id);
drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Orçamentos
-- -----------------------------------------------------------------------------
create table if not exists public.quotes (
  id                   uuid primary key default gen_random_uuid(),
  number               bigint generated always as identity (start with 501) unique,
  public_token         uuid not null default gen_random_uuid() unique,
  customer_id          uuid references public.customers (id) on delete set null,
  user_id              uuid references public.users (id) on delete set null,
  person_type          public.person_type not null default 'PF',
  name                 text not null,
  email                text not null,
  phone                text not null,
  document             text,
  company_name         text,
  city                 text,
  project_description  text,
  status               public.quote_status not null default 'novo',
  response_message     text,
  admin_notes          text,
  discount             numeric(12,2) not null default 0,
  shipping_cost        numeric(12,2) not null default 0,
  total                numeric(12,2),
  valid_until          date,
  responded_at         timestamptz,
  converted_order_id   uuid references public.orders (id) on delete set null,
  lgpd_consent_at      timestamptz not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists quotes_status_idx on public.quotes (status, created_at desc);
drop trigger if exists quotes_updated_at on public.quotes;
create trigger quotes_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();

alter table public.orders drop constraint if exists orders_quote_fk;
alter table public.orders add constraint orders_quote_fk
  foreign key (quote_id) references public.quotes (id) on delete set null;

create table if not exists public.quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes (id) on delete cascade,
  product_id   uuid references public.products (id) on delete set null,
  sku          text,
  description  text not null,
  unit         public.sale_unit not null default 'un',
  quantity     numeric(12,3) not null check (quantity > 0),
  unit_price   numeric(12,2),
  created_at   timestamptz not null default now()
);
create index if not exists quote_items_quote_idx on public.quote_items (quote_id);

-- =============================================================================
-- Funções de negócio
-- =============================================================================

-- Papel do usuário logado (SECURITY DEFINER evita recursão nas políticas de users)
create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'staff')
  );
$$;

-- Perfil automático ao criar conta no Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede que um usuário comum altere o próprio papel
create or replace function public.protect_user_role()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  -- Liberado para: admins, a service role (API) e o SQL Editor (postgres)
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'Somente administradores podem alterar papéis';
  end if;
  return new;
end $$;
drop trigger if exists users_protect_role on public.users;
create trigger users_protect_role before update on public.users
  for each row execute function public.protect_user_role();

-- Reserva de estoque atômica. p_items = [{"product_id": "...", "quantity": 2}, ...]
-- Lança erro se algum item não tiver saldo; tudo ou nada.
create or replace function public.reserve_stock(p_items jsonb)
returns void language plpgsql security definer
set search_path = ''
as $$
declare
  it jsonb;
  updated int;
begin
  for it in select * from jsonb_array_elements(p_items) loop
    update public.products
       set stock = stock - (it ->> 'quantity')::numeric,
           sold_count = sold_count + ceil((it ->> 'quantity')::numeric)::int
     where id = (it ->> 'product_id')::uuid
       and stock >= (it ->> 'quantity')::numeric;
    get diagnostics updated = row_count;
    if updated = 0 then
      raise exception 'ESTOQUE_INSUFICIENTE:%', it ->> 'product_id';
    end if;
  end loop;
end $$;
revoke all on function public.reserve_stock(jsonb) from public, anon, authenticated;

-- Histórico + datas + devolução de estoque em cada mudança de status
create or replace function public.on_order_status_change()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, status, note)
    values (new.id, new.status, 'Pedido criado');
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, created_by)
    values (new.id, new.status, auth.uid());

    if new.status = 'pago' and new.paid_at is null then new.paid_at = now(); end if;
    if new.status = 'entregue' then new.delivered_at = now(); end if;
    if new.status = 'cancelado' then
      new.cancelled_at = now();
      update public.products p
         set stock = p.stock + oi.quantity,
             sold_count = greatest(0, p.sold_count - ceil(oi.quantity)::int)
        from public.order_items oi
       where oi.order_id = new.id and oi.product_id = p.id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_status_ins on public.orders;
create trigger orders_status_ins after insert on public.orders
  for each row execute function public.on_order_status_change();
drop trigger if exists orders_status_upd on public.orders;
create trigger orders_status_upd before update of status on public.orders
  for each row execute function public.on_order_status_change();

-- Consumo de cupom com trava contra corrida
create or replace function public.consume_coupon(p_coupon_id uuid)
returns void language plpgsql security definer
set search_path = ''
as $$
declare updated int;
begin
  update public.coupons
     set used_count = used_count + 1
   where id = p_coupon_id and (max_uses is null or used_count < max_uses);
  get diagnostics updated = row_count;
  if updated = 0 then raise exception 'CUPOM_ESGOTADO'; end if;
end $$;
revoke all on function public.consume_coupon(uuid) from public, anon, authenticated;

-- Busca full-text + trigram (autocompletar tolerante a acentos e erros de digitação)
create or replace function public.search_products(q text, max_results int default 8)
returns table (
  id uuid, slug text, name text, sku text, price numeric, promo_price numeric,
  promo_ends_at timestamptz, unit public.sale_unit, category_slug text, image_url text, rank real
)
language sql stable
set search_path = ''
as $$
  with term as (
    select public.f_unaccent(lower(trim(regexp_replace(q, '[^[:alnum:][:space:]]', ' ', 'g')))) as t
  ), prefix as (
    select case when t = '' then null
           else to_tsquery('portuguese', regexp_replace(t, '\s+', ':* & ', 'g') || ':*') end as tsq, t
    from term
  )
  select p.id, p.slug, p.name, p.sku, p.price, p.promo_price, p.promo_ends_at, p.unit,
         c.slug as category_slug,
         (select pi.url from public.product_images pi where pi.product_id = p.id order by pi.sort_order limit 1) as image_url,
         (coalesce(ts_rank(p.search_vector, prefix.tsq), 0) * 2
           + extensions.similarity(public.f_unaccent(lower(p.name)), prefix.t))::real as rank
  from public.products p
  cross join prefix
  left join public.categories c on c.id = p.category_id
  where p.is_active
    and prefix.t is not null
    and (p.search_vector @@ prefix.tsq
         or extensions.word_similarity(prefix.t, public.f_unaccent(lower(p.name))) > 0.35
         or p.sku ilike prefix.t || '%')
  order by rank desc, p.sold_count desc
  limit greatest(1, least(max_results, 50));
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.users                enable row level security;
alter table public.customers            enable row level security;
alter table public.addresses            enable row level security;
alter table public.categories           enable row level security;
alter table public.brands               enable row level security;
alter table public.products             enable row level security;
alter table public.product_images       enable row level security;
alter table public.delivery_zones       enable row level security;
alter table public.coupons              enable row level security;
alter table public.banners              enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments             enable row level security;
alter table public.quotes               enable row level security;
alter table public.quote_items          enable row level security;

-- Remove políticas antigas para o script ser reexecutável
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- users
create policy "users: lê o próprio perfil"     on public.users for select using (id = auth.uid() or public.is_admin());
create policy "users: atualiza o próprio perfil" on public.users for update using (id = auth.uid() or public.is_admin());

-- customers / addresses: dono ou admin
create policy "customers: dono lê"        on public.customers for select using (user_id = auth.uid() or public.is_admin());
create policy "customers: dono cria"      on public.customers for insert with check (user_id = auth.uid());
create policy "customers: dono atualiza"  on public.customers for update using (user_id = auth.uid() or public.is_admin());

create policy "addresses: dono gerencia" on public.addresses for all
  using (public.is_admin() or exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid()))
  with check (public.is_admin() or exists (select 1 from public.customers c where c.id = customer_id and c.user_id = auth.uid()));

-- Catálogo: leitura pública do que está ativo; escrita só admin
create policy "categories: leitura pública" on public.categories for select using (active or public.is_admin());
create policy "categories: admin escreve"   on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "brands: leitura pública"     on public.brands for select using (active or public.is_admin());
create policy "brands: admin escreve"       on public.brands for all using (public.is_admin()) with check (public.is_admin());
create policy "products: leitura pública"   on public.products for select using (is_active or public.is_admin());
create policy "products: admin escreve"     on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "images: leitura pública"     on public.product_images for select using (true);
create policy "images: admin escreve"       on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "zones: leitura pública"      on public.delivery_zones for select using (active or public.is_admin());
create policy "zones: admin escreve"        on public.delivery_zones for all using (public.is_admin()) with check (public.is_admin());
create policy "banners: leitura pública"    on public.banners for select using (
  public.is_admin() or (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()))
);
create policy "banners: admin escreve"      on public.banners for all using (public.is_admin()) with check (public.is_admin());

-- Cupons: nunca expostos publicamente (validação via API com service role)
create policy "coupons: somente admin" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- Pedidos: cliente lê os próprios; criação/alteração só via servidor (service role) ou admin
create policy "orders: dono lê"      on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin altera" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "order_items: dono lê" on public.order_items for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "history: dono lê" on public.order_status_history for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "payments: dono lê" on public.payments for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Orçamentos
create policy "quotes: dono lê"       on public.quotes for select using (user_id = auth.uid() or public.is_admin());
create policy "quotes: admin altera"  on public.quotes for update using (public.is_admin()) with check (public.is_admin());
create policy "quote_items: dono lê"  on public.quote_items for select using (
  public.is_admin() or exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid())
);
create policy "quote_items: admin escreve" on public.quote_items for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- Storage: bucket público de imagens de produto (upload só admin)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "products bucket: leitura pública" on storage.objects;
drop policy if exists "products bucket: admin envia"     on storage.objects;
drop policy if exists "products bucket: admin altera"    on storage.objects;
drop policy if exists "products bucket: admin remove"    on storage.objects;
create policy "products bucket: leitura pública" on storage.objects for select using (bucket_id = 'products');
create policy "products bucket: admin envia"     on storage.objects for insert with check (bucket_id = 'products' and public.is_admin());
create policy "products bucket: admin altera"    on storage.objects for update using (bucket_id = 'products' and public.is_admin());
create policy "products bucket: admin remove"    on storage.objects for delete using (bucket_id = 'products' and public.is_admin());

-- Para promover o primeiro administrador (após criar a conta pelo site):
--   update public.users set role = 'admin' where email = 'seu-email@exemplo.com';
