create table public.subscription_invoices(id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete restrict,plan_code text not null references public.subscription_plans(code),period_start timestamptz not null,period_end timestamptz not null,amount_cents integer not null check(amount_cents>=0),currency text not null default 'BRL' check(currency='BRL'),status text not null default 'draft' check(status in ('draft','open','paid','void','uncollectible','refunded')),provider text,provider_invoice_id text unique,paid_at timestamptz,created_at timestamptz not null default now(),constraint invoice_period_valid check(period_end>period_start),constraint paid_has_date check(status<>'paid' or paid_at is not null),unique(restaurant_id,period_start,period_end));
create index subscription_invoices_restaurant_idx on public.subscription_invoices(restaurant_id,created_at desc);
alter table public.subscription_invoices enable row level security;
create policy "members read own invoices" on public.subscription_invoices for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy "gateon admins read invoices" on public.subscription_invoices for select to authenticated using(exists(select 1 from public.gateon_admins a where a.user_id=(select auth.uid())));
revoke all on public.subscription_invoices from anon,authenticated;
grant select on public.subscription_invoices to authenticated;
create or replace function public.restaurant_has_feature(p_restaurant uuid,p_feature text) returns boolean language sql stable security invoker set search_path='' as $$
 select coalesce((select (s.status in ('active','trialing')) and (s.current_period_end is null or s.current_period_end>now()) and p.active and coalesce((p.features->>p_feature)::boolean,false) from public.restaurant_subscriptions s join public.subscription_plans p on p.code=s.plan_code where s.restaurant_id=p_restaurant),false);
$$;
revoke all on function public.restaurant_has_feature(uuid,text) from public,anon;
grant execute on function public.restaurant_has_feature(uuid,text) to authenticated;
create or replace function public.my_restaurant_billing(p_restaurant uuid) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if (select auth.uid()) is null or not public.is_restaurant_member(p_restaurant) then raise exception 'Not authorized';end if;
 select jsonb_build_object('subscription',(select to_jsonb(x) from (select s.plan_code,s.status,s.current_period_start,s.current_period_end,p.monthly_cents,p.commission_bps from public.restaurant_subscriptions s join public.subscription_plans p on p.code=s.plan_code where s.restaurant_id=p_restaurant) x),'invoices',(select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at desc),'[]'::jsonb) from (select id,plan_code,period_start,period_end,amount_cents,status,paid_at,created_at from public.subscription_invoices where restaurant_id=p_restaurant order by created_at desc limit 12) i)) into result;
 return result;
end $$;
revoke all on function public.my_restaurant_billing(uuid) from public,anon;
grant execute on function public.my_restaurant_billing(uuid) to authenticated;
comment on table public.subscription_invoices is 'Billing ledger. Invoices are only created/updated by a trusted backend after PSP integration; no customer write grants.';