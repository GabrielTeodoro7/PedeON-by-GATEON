-- Applied to hosted Supabase as migration 20261120231830.
create table public.order_reviews (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.orders(id) on delete cascade,
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 customer_id uuid not null references auth.users(id) on delete cascade,
 rating smallint not null check (rating between 1 and 5),
 message text check (char_length(message)<=500),
 created_at timestamptz not null default now(),
 foreign key(order_id,restaurant_id) references public.orders(id,restaurant_id)
);
create index order_reviews_restaurant_idx on public.order_reviews(restaurant_id,created_at desc);
create index order_reviews_customer_idx on public.order_reviews(customer_id);
alter table public.order_reviews enable row level security;
create policy "customer reads own reviews" on public.order_reviews for select to authenticated using(customer_id=(select auth.uid()));
create policy "restaurant team reads reviews" on public.order_reviews for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy "customer reviews delivered orders" on public.order_reviews for insert to authenticated
with check (
 customer_id=(select auth.uid())
 and exists(select 1 from public.orders o where o.id=order_id and o.restaurant_id=order_reviews.restaurant_id and o.customer_id=(select auth.uid()) and o.status='delivered')
);
create or replace function public.my_heart_points()
returns bigint language sql stable security invoker set search_path='' as $$
 select coalesce(sum(o.total_cents / 100),0)::bigint
 from public.orders o where o.customer_id=(select auth.uid()) and o.status='delivered'
$$;
revoke all on function public.my_heart_points() from public,anon;
grant execute on function public.my_heart_points() to authenticated;
