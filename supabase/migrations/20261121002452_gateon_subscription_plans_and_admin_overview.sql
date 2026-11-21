-- PedeON: catálogo de planos e acesso administrativo; cobranças reais dependem de PSP.
create table public.subscription_plans(code text primary key check(code in ('start','pro','premium','enterprise')),name text not null,monthly_cents integer not null check(monthly_cents>=0),commission_bps integer not null check(commission_bps between 0 and 10000),active boolean not null default true,features jsonb not null default '{}'::jsonb);
insert into public.subscription_plans(code,name,monthly_cents,commission_bps,features) values
('start','ON Start',4990,300,'{"catalog":true,"orders":true,"qr":true}'),
('pro','ON Pro',9990,200,'{"catalog":true,"orders":true,"qr":true,"loyalty":true,"promotions":true,"stock":true,"reports":true}'),
('premium','ON Premium',19990,100,'{"catalog":true,"orders":true,"qr":true,"loyalty":true,"promotions":true,"stock":true,"reports":true,"whatsapp_ai":true,"dispatch":true}'),
('enterprise','ON Enterprise',39990,50,'{"catalog":true,"orders":true,"qr":true,"loyalty":true,"promotions":true,"stock":true,"reports":true,"whatsapp_ai":true,"dispatch":true,"multiunit":true,"priority_support":true}');
create table public.restaurant_subscriptions(restaurant_id uuid primary key references public.restaurants(id) on delete cascade,plan_code text not null references public.subscription_plans(code),status text not null default 'pending' check(status in ('pending','trialing','active','past_due','cancelled')),current_period_start timestamptz,current_period_end timestamptz,provider_subscription_id text unique,updated_at timestamptz not null default now(),constraint valid_period check(current_period_start is null or current_period_end is null or current_period_end>current_period_start));
create table public.gateon_admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.subscription_plans enable row level security;
alter table public.restaurant_subscriptions enable row level security;
alter table public.gateon_admins enable row level security;
create policy "read active plans" on public.subscription_plans for select to anon,authenticated using(active);
create policy "restaurant members view own subscription" on public.restaurant_subscriptions for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy "gateon admin sees subscriptions" on public.restaurant_subscriptions for select to authenticated using(exists(select 1 from public.gateon_admins a where a.user_id=(select auth.uid())));
create policy "gateon admin sees admins" on public.gateon_admins for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.subscription_plans,public.restaurant_subscriptions,public.gateon_admins from anon,authenticated;
grant select on public.subscription_plans to anon,authenticated;
grant select on public.restaurant_subscriptions,public.gateon_admins to authenticated;
create or replace function public.my_gateon_overview() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_result jsonb;
begin
 if (select auth.uid()) is null or not exists(select 1 from public.gateon_admins a where a.user_id=(select auth.uid())) then raise exception 'Not authorized'; end if;
 select jsonb_build_object('restaurants',(select count(*) from public.restaurants),'active_restaurants',(select count(*) from public.restaurants where active),'orders',(select count(*) from public.orders),'gross_order_cents',(select coalesce(sum(total_cents),0) from public.orders where status='delivered'),'subscriptions',(select coalesce(jsonb_object_agg(status,total),'{}'::jsonb) from (select status,count(*) total from public.restaurant_subscriptions group by status) x),'payments_paid_cents',(select coalesce(sum(amount_cents),0) from public.payment_transactions where status='paid'),'platform_fees_paid_cents',(select coalesce(sum(platform_fee_cents),0) from public.payment_transactions where status='paid')) into v_result;
 return v_result;
end $$;
revoke all on function public.my_gateon_overview() from public,anon;
grant execute on function public.my_gateon_overview() to authenticated;
comment on table public.restaurant_subscriptions is 'Subscription records managed by trusted billing backend; no automatic charge or self-activation.';
comment on table public.gateon_admins is 'No admins seeded; provision only after verifying ownership through trusted admin operations.';
