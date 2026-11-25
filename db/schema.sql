-- Individual SlotDrop catalog. Run in a NEW personal Supabase project.
-- Safe to re-run on this schema; existing rows are preserved.
begin;

create table if not exists public.products (
  id bigint generated always as identity primary key,
  sku text not null unique,
  name text not null,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  token uuid not null default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  shipping numeric(10,2) not null default 0 check (shipping >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  line_total numeric(10,2) not null check (line_total >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Clear only this catalog's named policy before recreating it.
drop policy if exists "anyone may read products" on public.products;
create policy "anyone may read products"
  on public.products for select to anon using (true);

-- Remove Supabase's possible default browser grants. No order policies exist.
revoke all on public.products, public.orders, public.order_items
  from public, anon, authenticated;
grant usage on schema public to anon;
grant select on public.products to anon;

commit;
