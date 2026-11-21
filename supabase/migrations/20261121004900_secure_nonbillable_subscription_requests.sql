create table public.subscription_requests(id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,requester_id uuid not null default auth.uid() references auth.users(id) on delete cascade,plan_code text not null references public.subscription_plans(code),status text not null default 'requested' check(status in ('requested','reviewing','awaiting_payment','completed','rejected','cancelled')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),constraint requester_required check(requester_id is not null));
create unique index subscription_requests_one_pending_per_restaurant on public.subscription_requests(restaurant_id) where status in ('requested','reviewing','awaiting_payment');
create index subscription_requests_by_restaurant on public.subscription_requests(restaurant_id,created_at desc);
alter table public.subscription_requests enable row level security;
create policy "manager can read requests" on public.subscription_requests for select to authenticated using(public.is_restaurant_manager(restaurant_id));
create policy "admin can read requests" on public.subscription_requests for select to authenticated using(exists(select 1 from public.gateon_admins a where a.user_id=(select auth.uid())));
create policy "manager can request plan" on public.subscription_requests for insert to authenticated with check(requester_id=(select auth.uid()) and status='requested' and public.is_restaurant_manager(restaurant_id) and exists(select 1 from public.subscription_plans p where p.code=plan_code and p.active));
revoke all on public.subscription_requests from anon,authenticated;
grant select,insert on public.subscription_requests to authenticated;
create or replace function public.request_subscription_plan(p_restaurant uuid,p_plan text) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
 if (select auth.uid()) is null or not public.is_restaurant_manager(p_restaurant) then raise exception 'Not authorized';end if;
 if not exists(select 1 from public.subscription_plans where code=p_plan and active) then raise exception 'Plan unavailable';end if;
 insert into public.subscription_requests(restaurant_id,requester_id,plan_code) values(p_restaurant,(select auth.uid()),p_plan) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.request_subscription_plan(uuid,text) from public,anon;
grant execute on function public.request_subscription_plan(uuid,text) to authenticated;
comment on table public.subscription_requests is 'Non-billable plan requests only; only trusted billing services can activate subscriptions or mark payments.';