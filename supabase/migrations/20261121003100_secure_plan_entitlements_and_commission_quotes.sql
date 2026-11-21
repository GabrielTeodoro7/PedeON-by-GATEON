create or replace function public.restaurant_plan_summary(p_restaurant uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v jsonb;
begin
 if (select auth.uid()) is null or not public.is_restaurant_member(p_restaurant) then raise exception 'Not authorized';end if;
 select jsonb_build_object('restaurant_id',s.restaurant_id,'plan',s.plan_code,'status',s.status,'monthly_cents',p.monthly_cents,'commission_bps',p.commission_bps,'features',p.features,'current_period_end',s.current_period_end,'entitled',(s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end>now()))) into v from public.restaurant_subscriptions s join public.subscription_plans p on p.code=s.plan_code where s.restaurant_id=p_restaurant;
 return coalesce(v,jsonb_build_object('restaurant_id',p_restaurant,'plan',null,'status','not_subscribed','entitled',false));
end $$;
revoke all on function public.restaurant_plan_summary(uuid) from public,anon;
grant execute on function public.restaurant_plan_summary(uuid) to authenticated;
create or replace function public.restaurant_fee_quote(p_restaurant uuid,p_amount_cents integer)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v_rate integer;v_status text;v_end timestamptz;v_fee integer;
begin
 if (select auth.uid()) is null or not public.is_restaurant_member(p_restaurant) then raise exception 'Not authorized';end if;
 if p_amount_cents is null or p_amount_cents<0 or p_amount_cents>100000000 then raise exception 'Invalid amount';end if;
 select p.commission_bps,s.status,s.current_period_end into v_rate,v_status,v_end from public.restaurant_subscriptions s join public.subscription_plans p on p.code=s.plan_code where s.restaurant_id=p_restaurant and p.active;
 if not found or v_status not in ('active','trialing') or (v_end is not null and v_end<=now()) then raise exception 'No active subscription';end if;
 v_fee=(p_amount_cents::bigint*v_rate/10000)::integer;
 return jsonb_build_object('amount_cents',p_amount_cents,'commission_bps',v_rate,'platform_fee_cents',v_fee,'merchant_amount_cents',p_amount_cents-v_fee,'simulation_only',true);
end $$;
revoke all on function public.restaurant_fee_quote(uuid,integer) from public,anon;
grant execute on function public.restaurant_fee_quote(uuid,integer) to authenticated;
comment on function public.restaurant_fee_quote(uuid,integer) is 'Simulates commission from the active plan. Not a payment or PSP split authorization.';