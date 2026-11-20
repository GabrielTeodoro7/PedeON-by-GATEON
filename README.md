# 🍔 PedeON by GATEON

Plataforma de pedidos para restaurantes. O repositório contém **duas experiências distintas**:

- **`index.html`**: protótipo demonstrativo de consumidor, restaurante, entregador e GATEON, com dados apenas no navegador (`localStorage`).
- **`painel.html`**: MVP conectado ao **Supabase**, com autenticação, cadastro de restaurantes, categorias, produtos, pedidos e alteração de status.

## Acessar

Abra `painel.html` pelo servidor estático (ex.: `python -m http.server 5500`) e acesse `http://localhost:5500/painel.html`. Também há um link no topo da página inicial.

O frontend usa a **chave publicável** do projeto Supabase (segura para uso público com RLS). **Nunca inclua a chave secreta/service_role no frontend**.

## Fluxo conectado

1. Criar conta com e-mail e senha; confirmar e-mail se solicitado.
2. Criar restaurante e escolher slug exclusivo.
3. Adicionar categoria e produtos com preço.
4. Na área de pedidos, selecionar o restaurante, adicionar produtos e confirmar com uma conta autenticada.
5. No painel do restaurante, consultar pedidos e atualizar o status.

O checkout chama uma função SQL que calcula os preços a partir do banco, evitando confiar nos valores enviados pelo navegador. Cada restaurante possui ID próprio, relacionamentos e políticas de segurança por usuário.

## Novidades criativas 💗

- **Meus queridinhos:** clientes autenticados podem salvar produtos favoritos, persistidos no Supabase com RLS individual.
- **Recadinho da casa:** cada restaurante pode personalizar uma mensagem de boas-vindas exibida no cardápio.
- **Filtro de favoritos:** o cliente alterna entre todo o cardápio e os produtos salvos.

## Banco de dados

Projeto Supabase: `PedeON-by-GATEON`. Tabelas: `restaurants`, `restaurant_members`, `categories`, `products`, `orders`, `order_items`. Migrações aplicadas diretamente no projeto hospedado.

## Importante: limites atuais

**Este é um MVP inicial, não um SaaS pronto para produção.** O protótipo em `index.html` não usa o banco remoto; use `painel.html` para o fluxo conectado. Ainda faltam pagamentos reais, frete, logística de motoboys, WhatsApp/IA, assinaturas, relatórios financeiros, estoque, mesas, GATEON superadmin, testes automatizados e deploy configurado. Não há processamento de pagamentos ou envio de entregas reais. Antes de uso comercial, implementar auditoria, rate limiting, antifraude, permissões detalhadas, LGPD e testes end-to-end.

## Tecnologias

HTML, CSS, JavaScript, Supabase JS 2.x, Supabase Auth, PostgreSQL e Row Level Security.
