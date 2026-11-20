# 🍔 PedeON by GATEON

Plataforma de pedidos e gestão para restaurantes. **Primeira entrega: protótipo front-end funcional**, com quatro experiências: consumidor, restaurante, entregador e administração central.

## Executar localmente
Abra `index.html` no navegador ou execute `python -m http.server 5500` e acesse http://localhost:5500.

## Funcionalidades implementadas
- Cardápio público com busca, categorias e carrinho
- Checkout demonstrativo com nome, endereço e forma de pagamento
- Restaurante: aceitar, preparar e liberar pedidos
- Entregador: aceitar corrida, retirar e concluir entrega
- GATEON: KPIs e monitoramento dos pedidos
- Persistência local via `localStorage`; layout responsivo

## Atenção
**Protótipo demonstrativo, não SaaS pronto para produção.** Não há autenticação, banco de dados remoto, pagamentos reais, WhatsApp, GPS ou integrações logísticas. Dados permanecem no mesmo navegador. Não utilize dados reais de clientes.

## Roadmap
1. API multiempresa, PostgreSQL, migrações e isolamento por tenant
2. Login seguro, permissões e auditoria
3. Pedidos transacionais, estoque, financeiro e testes
4. WhatsApp oficial, gateway de pagamentos e logística contratada
5. Deploy, observabilidade, backups e conformidade LGPD

**Identidade:** vermelho, laranja, verde e branco. **Produto:** PedeON. **Empresa:** GATEON.
