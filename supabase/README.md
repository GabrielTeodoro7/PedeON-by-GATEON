# Supabase — PedeON

Projeto hospedado: `lutemrmbswbcxiznfhny`.

## Estado atual

O banco remoto possui **nove migrações já aplicadas** (verificado em 20/11/2026). Este diretório contém migrações recentes de segurança e personalização, mas ainda não contém todo o histórico inicial.

**Atenção:** antes de habilitar GitHub Integration ou executar `supabase db push`, é obrigatório recuperar e versionar as quatro migrações anteriores no mesmo histórico, ou executar uma reconciliação supervisionada com o Supabase CLI. **Não rode db reset nem aplique estas migrações isoladamente em um banco vazio.**

Migrações anteriores no banco:
- 20261120230743_initial_pedeon_multitenant_schema
- 20261120230753_restrict_existing_rls_auto_enable_execution
- 20261120230822_secure_restaurant_onboarding_and_order_checkout
- 20261120230946_limit_order_updates_to_status

Migrações versionadas aqui:
- 20261120231408_enforce_order_status_transitions
- 20261120231419_restrict_order_mutations_to_validated_rpcs
- 20261120231609_customer_favorites_and_restaurant_welcome_messages
- 20261120231830_customer_order_reviews_and_heart_points
- 20261120232243_on_deals_stock_dispatch_modules

Nunca faça commit de service_role, secret keys, senhas ou connection strings com senha.
