# Supabase — PedeON

Projeto hospedado: `lutemrmbswbcxiznfhny`.

## Estado atual

O banco remoto possui **seis migrações já aplicadas**. Este diretório contém apenas as duas migrações mais recentes de endurecimento de segurança.

**Atenção:** antes de habilitar GitHub Integration ou executar `supabase db push`, é obrigatório recuperar e versionar as quatro migrações anteriores no mesmo histórico, ou executar uma reconciliação supervisionada com o Supabase CLI. **Não rode db reset nem aplique estas migrações isoladamente em um banco vazio.**

Migrações anteriores no banco:
- 20261120230743_initial_pedeon_multitenant_schema
- 20261120230753_restrict_existing_rls_auto_enable_execution
- 20261120230822_secure_restaurant_onboarding_and_order_checkout
- 20261120230946_limit_order_updates_to_status

Migrações versionadas aqui:
- 20261120231408_enforce_order_status_transitions
- 20261120231419_restrict_order_mutations_to_validated_rpcs

Nunca faça commit de service_role, secret keys, senhas ou connection strings com senha.
