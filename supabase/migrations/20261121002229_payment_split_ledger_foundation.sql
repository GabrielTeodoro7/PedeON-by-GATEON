create table if not exists public.payment_settings(
 restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
 provider text not null default 'unconfigured' check(provider in ('unconfigured','mercadopago','pagarme','stripe')),
 provider_account_id text,
 platform_fee_bps integer not null default 300 check(platform_fee_bps between 0 and 1000),
 enabled boolean not null default false,
 updated_at timestamptz not null default now(),
 constraint payment_settings_enabled_requires_account check(not enabled or (provider<>'unconfigured' and nullif(trim(provider_account_id),'') is not null))
);
create table if not exists public.payment_transactions(
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.orders(id) on delete restrict,
 restaurant_id uuid not null references public.restaurants(id) on delete restrict,
 provider text not null,
 provider_payment_id text unique,
 amount_cents integer not null check(amount_cents>=0),
 platform_fee_cents integer not null check(platform_fee_cents>=0),
 merchant_amount_cents integer generated always as (amount_cents-platform_fee_cents) stored,
 status text not null default 'pending' check(status in ('pending','processing','paid','failed','refunded','partially_refunded')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint fee_not_greater_than_amount check(platform_fee_cents<=amount_cents)
);
create index if not exists payment_transactions_restaurant_created_idx on public.payment_transactions(restaurant_id,created_at desc);
alter table public.payment_settings enable row level security;
alter table public.payment_transactions enable row level security;
create policy "merchant can read payment settings" on public.payment_settings for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy "merchant can read transactions" on public.payment_transactions for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy "customer can read own payment transaction" on public.payment_transactions for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=(select auth.uid())));
revoke all on public.payment_settings,public.payment_transactions from anon,authenticated;
grant select on public.payment_settings,public.payment_transactions to authenticated;
comment on table public.payment_transactions is 'Ledger de pagamentos; somente backend confiável pode criar e atualizar após confirmação assinada do PSP. Não equivale a uma cobrança real.';
comment on column public.payment_settings.platform_fee_bps is 'Comissão da plataforma em basis points: 300 = 3%. Valor ilustrativo até contrato comercial.';