-- Restrict premium module writes to subscribed restaurant features.
drop policy if exists "managers create promotions" on public.promotions;
create policy "managers create promotions" on public.promotions for insert to authenticated with check(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'promotions'));
drop policy if exists "managers update promotions" on public.promotions;
create policy "managers update promotions" on public.promotions for update to authenticated using(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'promotions')) with check(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'promotions'));
drop policy if exists "managers create stock" on public.inventory_items;
create policy "managers create stock" on public.inventory_items for insert to authenticated with check(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'stock'));
drop policy if exists "managers update stock" on public.inventory_items;
create policy "managers update stock" on public.inventory_items for update to authenticated using(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'stock')) with check(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'stock'));
drop policy if exists "managers delete stock" on public.inventory_items;
create policy "managers delete stock" on public.inventory_items for delete to authenticated using(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'stock'));
drop policy if exists "managers assign courier" on public.delivery_assignments;
create policy "managers assign courier" on public.delivery_assignments for insert to authenticated with check(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'dispatch') and exists(select 1 from public.orders o where o.id=order_id and o.restaurant_id=delivery_assignments.restaurant_id and o.fulfillment='delivery' and o.status not in ('cancelled','delivered')));
drop policy if exists "managers edit courier" on public.delivery_assignments;
create policy "managers edit courier" on public.delivery_assignments for update to authenticated using(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'dispatch')) with check(public.is_restaurant_manager(restaurant_id) and public.restaurant_has_feature(restaurant_id,'dispatch'));