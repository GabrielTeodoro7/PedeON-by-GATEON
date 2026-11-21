create table public.subscription_request_events(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.subscription_requests(id) on delete restrict,actor_id uuid not null references auth.users(id) on delete restrict,from_status text not null,to_status text not null,note text,created_at timestamptz not null default now());
create index subscription_request_events_request_idx on public.subscription_request_events(request_id,created_at desc);
alter table public.subscription_request_events enable row level security;
create policy "admins read request audit" on public.subscription_request_events for select to authenticated using(exists(select 1 from public.gateon_admins a where a.user_id=(select auth.uid())));
create policy "restaurant managers read request audit" on public.subscription_request_events for select to authenticated using(exists(select 1 from public.subscription_requests r where r.id=request_id and public.is_restaurant_manager(r.restaurant_id)));
revoke all on public.subscription_request_events from anon,authenticated;
grant select on public.subscription_request_events to authenticated;
create or replace function public.gateon_review_subscription_request(p_request uuid,p_status text,p_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid;v_request public.subscription_requests%rowtype;
begin
 v_actor=(select auth.uid());
 if v_actor is null or not exists(select 1 from public.gateon_admins a where a.user_id=v_actor) then raise exception 'Not authorized';end if;
 if p_status not in ('reviewing','awaiting_payment','rejected') then raise exception 'Invalid review status';end if;
 if length(coalesce(p_note,''))>500 then raise exception 'Note too long';end if;
 select * into v_request from public.subscription_requests where id=p_request for update;
 if not found then raise exception 'Request not found';end if;
 if not ((v_request.status='requested' and p_status in ('reviewing','rejected')) or (v_request.status='reviewing' and p_status in ('awaiting_payment','rejected'))) then raise exception 'Invalid transition';end if;
 update public.subscription_requests set status=p_status,updated_at=now() where id=p_request;
 insert into public.subscription_request_events(request_id,actor_id,from_status,to_status,note) values(p_request,v_actor,v_request.status,p_status,nullif(trim(p_note),''));
 return jsonb_build_object('id',p_request,'from',v_request.status,'to',p_status,'billing_activated',false);
end $$;
revoke all on function public.gateon_review_subscription_request(uuid,text,text) from public,anon;
grant execute on function public.gateon_review_subscription_request(uuid,text,text) to authenticated;
comment on function public.gateon_review_subscription_request(uuid,text,text) is 'Admin review only: cannot mark paid, complete request, or activate subscription.';