# PedeON by GATEON — Roteiro até 100%

**Referência inicial: 35% (estimativa de escopo, não percentual de código ou testes).**
O progresso só aumenta após entrega no GitHub + verificação adequada. As porcentagens abaixo são pesos de conclusão, não horas. O produto não está pronto para produção até concluir a etapa 10.

| Etapa | Peso | Entregas | Aceite |
|---|---:|---|---|
| 1. Fundação multiempresa | 15% | Auth, RLS, restaurantes, categorias, produtos, pedidos e migrações | Isolamento multi-tenant e testes de autorização |
| 2. Operação de pedidos | 10% | Checkout, status, retirada/entrega, avaliações, favoritos | Fluxos reais de navegador e banco |
| 3. Planos e ON Control | 12% | Start/Pro/Premium/Enterprise, direitos por plano, superadmin, auditoria | Assinatura não pode ser autoativada pelo cliente |
| 4. Pagamentos e faturamento | 15% | Pix/cartão, split por plano, cobrança mensal, webhooks, estornos | Sandbox PSP, reconciliação e testes de idempotência |
| 5. WhatsApp e IA | 12% | Meta Cloud API, assistente por loja, handoff humano, fila e limites por plano | Mensagens reais de teste, privacidade e consentimento |
| 6. ON Kitchen, ON Self e mesas | 10% | Cozinha, totem, QR Code, comandas e personalização | Fluxos completos de atendimento |
| 7. Logística, estoque e marketing | 9% | Entregadores, rastreio, ficha técnica, cupons, ON Club | Testes de estoque, cupons e logística |
| 8. ON Forecast e relatórios | 5% | DRE, conciliação, previsões e métricas | Métricas conferidas com dados de teste |
| 9. Experiência e qualidade | 7% | Responsividade, PWA, acessibilidade, E2E, carga, segurança e LGPD | Testes em desktop, tablet e celular |
| 10. Publicação e ativação | 5% | Domínio, contas de provedores, segredos, homologação e produção | Checklist de go-live e validação autorizada |

## Valores comerciais aprovados para implementação
- ON Start: R$ 49,90/mês + 3% por pedido online pago.
- ON Pro: R$ 99,90/mês + 2% por pedido online pago.
- ON Premium: R$ 199,90/mês + 1% por pedido online pago.
- ON Enterprise: R$ 399,90/mês + 0,5% por pedido online pago.
- Custos de processador, impostos, estornos e uso excedente de IA/WhatsApp separados; verificar viabilidade econômica antes de lançar.

## Situação real — 2026-11-20
- [x] Esquema de pedidos multiempresa com políticas RLS e testes SQL pontuais.
- [x] Protótipo web Supabase para cardápio, pedidos e gerenciamento.
- [x] Estrutura de registro de pagamentos (sem processar cobranças).
- [x] Tabela de quatro planos, assinaturas e função de visão geral GATEON, sem administradores provisionados.
- [x] Função WhatsApp/IA implantada, **não operacional sem credenciais**.
- [ ] Aplicar plano contratado ao checkout e ao cálculo de comissão com validação de backend.
- [ ] Implementar provedor de pagamentos e assinaturas reais.
- [ ] Implementar ON Control com autorização, auditoria e operações administrativas.
- [ ] Implementar WhatsApp/IA multiempresa, filas, idempotência, limites e handoff.
- [ ] Finalizar ON Kitchen, ON Self, ON Forecast, ON Club, estoque, logística, mesas e cupons.
- [ ] Testes E2E e revisão de segurança antes do lançamento.

## Atividades manuais reservadas ao final
1. Escolher/contratar PSP com split marketplace e abrir contas recebedoras verificadas.
2. Criar e aprovar WhatsApp Business Cloud API e números dos restaurantes.
3. Criar conta de API de IA e configurar limite de gastos.
4. Escolher domínio, DNS, e-mail transacional e hospedagem de produção.
5. Configurar secrets exclusivamente no ambiente seguro (nunca no GitHub).
6. Confirmar quem será administrador GATEON e provisionar acesso por canal seguro.
7. Revisar termos, LGPD, contrato com restaurantes, tarifas e questões tributárias.
8. Autorizar homologação e lançamento.

**Observação:** credenciais externas são pré-requisito para testes integrados reais; portanto o código e testes simulados podem ser feitos antes, mas os testes finais de homologação dependem das configurações manuais.

## Regra de atualização de progresso
Cada entrega deve informar: **progresso estimado**, arquivos alterados, testes executados, pendências e bloqueios. Não confundir código criado, teste automatizado configurado, teste executado e funcionalidade homologada.
