-- Orders are created and transitioned exclusively through validated RPCs.
revoke insert,update,delete on public.order_items from authenticated,anon;
drop policy if exists "staff update order items" on public.order_items;
revoke insert,update,delete on public.orders from authenticated,anon;
