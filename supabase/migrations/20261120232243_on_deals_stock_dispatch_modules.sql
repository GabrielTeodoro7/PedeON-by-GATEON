-- Applied to hosted Supabase as 20261120232243.
create table public.promotions (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 code text not null check(code ~ '^[A-Z0-9_-]{3,24}$'),
 discount_percent integer not null check(discount_percent between 1 and 70),
 active boolean not null default true,
 expires_at timestamptz,
 created_at timestamptz not null default now(),
 unique(restaurant_id,code)
);
alter table public.promotions enable row level security;
create policy "promotions public active read" on public.promotions for select to anon,authenticated
 using(active and (expires_at is null or expires_at>now()) and exists(select 1 from public.restaurants r where r.id=restaurant_id and r.active));
create policy "managers read all promotions" on public.promotions for select to authenticated using(public.is_restaurant_manager(restaurant_id));
create policy "managers create promotions" on public.promotions for insert to authenticated with check(public.is_restaurant_manager(restaurant_id));
create policy "managers update promotions" on public.promotions for update to authenticated using(public.is_restaurant_manager(restaurant_id)) with check(public.is_restaurant_manager(restaurant_id));
create table public.inventory_items (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 name text not null check(char_length(trim(name)) between 2 and 120),
 unit text not null default 'un' check(unit in ('un','kg','g','l','ml')),
 quantity numeric(12,3) not null default 0 check(quantity>=0),
 minimum_quantity numeric(12,3) not null default 0 check(minimum_quantity>=0),
 created_at timestamptz not null default now()
);
create index inventory_restaurant_idx on public.inventory_items(restaurant_id);
alter table public.inventory_items enable row level security;
create policy "team reads stock" on public.inventory_items for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy "managers create stock" on public.inventory_items for insert to authenticated with check(public.is_restaurant_manager(restaurant_id));
create policy "managers update stock" on public.inventory_items for update to authenticated using(public.is_restaurant_manager(restaurant_id)) with check(public.is_restaurant_manager(restaurant_id));
create policy "managers delete stock" on public.inventory_items for delete to authenticated using(public.is_restaurant_manager(restaurant_id));
create table public.delivery_assignments (
 order_id uuid primary key references public.orders(id) on delete cascade,
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 courier_name text not null check(char_length(trim(courier_name)) between 2 and 120),
 courier_phone text check(char_length(courier_phone)<=25),
 created_at timestamptz not null default now(),
 foreign key(order_id,restaurant_id) references public.orders(id,restaurant_id)
);
alter table public.delivery_assignments enable row level security;
create policy "team reads dispatch" on public.delivery_assignments for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy "customer reads own dispatch" on public.delivery_assignments for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=(select auth.uid())));
create policy "managers assign courier" on public.delivery_assignments for insert to authenticated with check(public.is_restaurant_manager(restaurant_id) and exists(select 1 from public.orders o where o.id=order_id and o.restaurant_id=delivery_assignments.restaurant_id and o.fulfillment='delivery' and o.status not in ('cancelled','delivered')));
create policy "managers edit courier" on public.delivery_assignments for update to authenticated using(public.is_restaurant_manager(restaurant_id)) with check(public.is_restaurant_manager(restaurant_id));
