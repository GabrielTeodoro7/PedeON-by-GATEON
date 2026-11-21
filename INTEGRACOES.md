# Integrações externas — configuração pendente

## Pagamentos
O banco possui `payment_settings` e `payment_transactions` com RLS. O padrão é **desabilitado**, e a comissão demonstrativa é de **300 basis points (3%)**. Nenhum pagamento real é criado, aprovado ou dividido apenas por existir esse esquema.

Antes de aceitar dinheiro:
1. Escolher um PSP com split para marketplace (por exemplo, Mercado Pago, Pagar.me ou Stripe Connect, sujeito a disponibilidade e contrato no Brasil).
2. Conectar e verificar cada restaurante na plataforma do PSP, sem coletar credenciais bancárias no frontend.
3. Implementar o checkout no backend com chave secreta, idempotência, contas destinatárias e cálculo de tarifas.
4. Validar assinatura de webhook do PSP e consultar o pagamento no PSP antes de atualizar status.
5. Tratar estornos, chargebacks, conciliação, tributos e falhas.
6. Testar no sandbox e depois com transações reais de baixo valor autorizadas.

**Nunca** calcular ou confirmar a comissão somente no navegador. O ledger é somente leitura para clientes e restaurantes; escrita reservada a serviços confiáveis.

## WhatsApp + IA
A Edge Function `whatsapp-ai` está implantada. Webhook:
`https://lutemrmbswbcxiznfhny.supabase.co/functions/v1/whatsapp-ai`

Configurar os secrets da função no Supabase:
- `META_VERIFY_TOKEN`: token escolhido para validar o webhook da Meta.
- `META_APP_SECRET`: segredo do aplicativo Meta, usado para HMAC-SHA256.
- `META_WHATSAPP_TOKEN`: token de acesso oficial da API WhatsApp Cloud.
- `META_PHONE_NUMBER_ID`: identificador do número WhatsApp Business.
- `OPENAI_API_KEY`: chave privada da API de IA.
- `OPENAI_MODEL`: opcional, modelo habilitado para a conta.

A função não confirma pedidos, não informa preços fictícios e não pede cartão. Sem segredos configurados retorna 503. Antes de produção, implementar deduplicação de IDs de mensagens, fila/retry, limite de requisições, registro de consentimento, transferência para atendente, vínculo seguro de cada número ao restaurante e monitoramento. A função atual é **protótipo técnico**, não automação comercial pronta.

Nenhuma dessas chaves deve ser colocada no GitHub, em `painel.html` ou em `supabase-app.js`.
