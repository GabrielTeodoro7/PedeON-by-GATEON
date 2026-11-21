create or replace function public.advance_order(p_order uuid,p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare v_order public.orders%rowtype;
begin
 if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
 select * into v_order from public.orders where id=p_order for update;
 if not found then raise exception 'Order not found'; end if;
 if not public.is_restaurant_member(v_order.restaurant_id) then raise exception 'Not authorized'; end if;
 if not (
  (v_order.status='pending' and p_status in ('accepted','cancelled')) or
  (v_order.status='accepted' and p_status in ('preparing','cancelled')) or
  (v_order.status='preparing' and p_status in ('ready','cancelled')) or
  (v_order.status='ready' and v_order.fulfillment='delivery' and p_status='dispatched') or
  (v_order.status='ready' and v_order.fulfillment='pickup' and p_status='delivered') or
  (v_order.status='dispatched' and v_order.fulfillment='delivery' and p_status='delivered')
 ) then raise exception 'Invalid order status transition'; end if;
 update public.orders set status=p_status where id=p_order;
end $$;
revoke all on function public.advance_order(uuid,text) from public,anon;
grant execute on function public.advance_order(uuid,text) to authenticated;
