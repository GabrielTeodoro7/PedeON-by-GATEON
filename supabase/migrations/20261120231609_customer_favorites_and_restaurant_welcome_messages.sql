-- Applied on hosted Supabase as migration 20261120231609.
create table public.product_favorites (
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,product_id)
);
create index product_favorites_product_idx on public.product_favorites(product_id);
alter table public.product_favorites enable row level security;
create policy "customers read own favorites" on public.product_favorites for select to authenticated using (user_id=(select auth.uid()));
create policy "customers add own favorites" on public.product_favorites for insert to authenticated with check (
 user_id=(select auth.uid()) and exists(
 select 1 from public.products p join public.restaurants r on r.id=p.restaurant_id
 where p.id=product_id and p.available and r.active
 )
);
create policy "customers remove own favorites" on public.product_favorites for delete to authenticated using (user_id=(select auth.uid()));
alter table public.restaurants add column if not exists welcome_message text not null default 'Feito com carinho, especialmente para você! 💛'
 check (char_length(welcome_message) <= 180);
create policy "owners update restaurant welcome" on public.restaurants for update to authenticated
 using (exists(select 1 from public.restaurant_members m where m.restaurant_id=id and m.user_id=(select auth.uid()) and m.role in ('owner','manager')))
 with check (exists(select 1 from public.restaurant_members m where m.restaurant_id=id and m.user_id=(select auth.uid()) and m.role in ('owner','manager')));
revoke update on public.restaurants from authenticated;
grant update(welcome_message) on public.restaurants to authenticated;
