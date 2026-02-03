# Plano de Implementação — SOFHIA Enterprise

## Estratégia de Desenvolvimento

Abordagem **incremental por módulos**, priorizando o **MVP funcional** conforme critérios de aceite do PRD:

1. **Fase 1 (MVP)**: Setup + Módulos essenciais (Dashboard, Monitoramento, Neurocore, Financeiro, Parâmetros)
2. **Fase 2**: Módulos complementares (Atendimento, Onboarding, Integrações, etc.)
3. **Fase 3**: Refinamentos, módulos avançados (Experimentos A/B, Guardrails, etc.)

---

## Fase 1: MVP (Núcleo Funcional)

### 1. Setup do Projeto

**Inicializar Next.js com TypeScript e configurações base**

- Criar projeto Next.js 14+ com App Router
- Configurar TypeScript strict mode
- Instalar dependências core:
  - Tailwind CSS 3.x
  - Shadcn/UI (via CLI)
  - Lucide Icons
  - React Query (TanStack Query)
  - Supabase client

**Estrutura de diretórios sugerida:**

```
/app
  /dashboard
  /monitoramento
  /neurocore
  /atendimento
  /financeiro
  /parametros
  /(auth)
    /login
    /cadastro
/components
  /ui (shadcn)
  /dashboard
  /charts
  /tables
/lib
  /supabase
  /utils
  /hooks
/types
  /database.ts
  /models.ts
```

**Configurações Tailwind:**

- Paleta customizada com brand colors:
  - `primary`: #005c2d (Verde Floresta)
  - `secondary`: #2d2d2d (Preto Carvão)
  - `background`: #F8FAFC (Cinza Gelo)
- Configurar Montserrat como fonte padrão

**Arquivos de configuração:**

- [`tailwind.config.ts`] com paleta e tipografia
- [`next.config.js`] com otimizações
- [`.env.local`] para variáveis ambiente (Supabase URL, anon key)

---

### 2. Supabase e Banco de Dados

**Setup Supabase:**

1. Criar projeto no Supabase (ou configurar localmente)
2. Executar script SQL do schema v3.5 fornecido
3. Configurar Row Level Security (RLS) para multi-tenancy:
  - Políticas por `id_empresa` em todas as tabelas sensíveis
  - Usuários só acessam dados da própria empresa
4. Criar RPC Functions para consultas complexas:
  - `buscar_dados_empresa_por_company_name`
  - `calcular_kpis_dashboard`
  - `buscar_conversas_com_filtros`

**Gerar tipos TypeScript:**

```bash
npx supabase gen types typescript --project-id PROJECT_ID > types/database.ts
```

**Cliente Supabase:**

Criar [`lib/supabase/client.ts`] com:

- Client para server components
- Client para client components
- Helper para auth

---

### 3. Autenticação (Supabase Auth)

**Implementar fluxo de auth:**

- Telas: Login, Cadastro, Reset de senha
- Integração com `usuarios_sofhia` table
- Middleware para rotas protegidas
- Context de usuário e empresa

**Componentes:**

- [`app/(auth)/login/page.tsx`]
- [`app/(auth)/cadastro/page.tsx`]
- [`components/auth/AuthProvider.tsx`]
- [`middleware.ts`] para proteção de rotas

---

### 4. Layout Principal (Shell)

**Criar estrutura de navegação:**

**Componentes:**

1. **Sidebar** ([`components/layout/Sidebar.tsx`]):
  - Links para módulos
  - Indicador do módulo ativo
  - Colapsável em mobile
  - Navegação:
    - Dashboard
    - Monitoramento
    - Neurocore (com sub-items: Editor, Base, Simulador)
    - Atendimento
    - Financeiro
    - Parâmetros
2. **Topbar** ([`components/layout/Topbar.tsx`]):
  - Nome da empresa (query em `empresa`)
  - Saldo de créditos (indicador rápido)
  - Avatar/menu do usuário
3. **Layout wrapper** ([`app/(dashboard)/layout.tsx`]):
  - Grid: Sidebar + Main content
  - Responsivo (sidebar collapsa em mobile)

---

### 5. Módulo 1: Dashboard (Visão Estratégica)

**Objetivo:** Provar ROI com KPIs e gráficos de performance.

**Componentes principais:**

1. **KPI Cards** ([`components/dashboard/KPICards.tsx`]):
  - Vendas Hoje (R$)
  - Conversas Ativas
  - Leads Gerados
  - Taxa de Conversão
  - Fonte: queries agregadas em `vendas_contratos`, `conversas`, `pessoas`, `conversas_tags`
2. **Gráfico de Tendência** ([`components/dashboard/SalesChart.tsx`]):
  - Biblioteca sugerida: **Recharts**
  - Área chart: vendas dos últimos 30 dias
  - Dados: `vendas_contratos` agrupados por data
3. **Funil de Vendas** ([`components/dashboard/SalesFunnel.tsx`]):
  - Barras horizontais ou funil invertido
  - Etapas: Início > Lead > Negociação > Venda
  - Fonte: `conversas_tags` com tags mapeadas por etapa
4. **Heatmap Operacional** ([`components/dashboard/ActivityHeatmap.tsx`]):
  - Matriz Dia da Semana x Hora
  - Volume de `interacoes` por período
  - Biblioteca: criar custom ou usar Recharts
5. **Live Feed de Vendas** ([`components/dashboard/SalesTable.tsx`]):
  - Tabela com últimas vendas
  - Colunas: Cliente, Serviço, Valor, Data, Ação (Ver Contrato)
  - Fonte: `vendas_contratos` ordenado por `created_at DESC`

**Queries (React Query):**

- [`lib/hooks/useDashboardKPIs.ts`]
- [`lib/hooks/useSalesTrend.ts`]
- [`lib/hooks/useSalesFunnel.ts`]
- [`lib/hooks/useRecentSales.ts`]

**Página:**

- [`app/(dashboard)/dashboard/page.tsx`]

---

### 6. Módulo 2: Monitoramento (Infraestrutura)

**Objetivo:** Garantir estabilidade e conexão com UpChat.

**Componentes principais:**

1. **Health Cards** ([`components/monitoring/HealthCards.tsx`]):
  - API Status (verde pulsando / vermelho estático)
  - Token Status
  - Usuário Sofhia Status
  - Fonte: queries em `configuracoes_upchat` + chamada de health check
2. **Controle de Instância** ([`components/monitoring/InstanceControl.tsx`]):
  - Exibir CPU/RAM (mock ou via API n8n)
  - Botões: Parar, Reiniciar
  - Modal de confirmação com input "REINICIAR"
3. **Logs de Conexão** ([`components/monitoring/ConnectionLogs.tsx`]):
  - Estilo terminal
  - Últimos 50 logs (mock ou via WebSocket)
  - Auto-scroll para mais recente

**Ações:**

- Funções para testar conexão UpChat
- Integração com n8n (se disponível) ou mock

**Página:**

- [`app/(dashboard)/monitoramento/page.tsx`]

---

### 7. Módulo 3: Neurocore (Configuração de IA)

**Objetivo:** Interface no-code para configurar comportamento da IA.

#### 7.1 Editor de Agente (Drag & Drop)

**Componentes:**

1. **Abas** ([`components/neurocore/AgentTabs.tsx`]):
  - Persona
  - Instruções
  - Extrações
2. **Builder de Instruções** ([`components/neurocore/InstructionBuilder.tsx`]):
  - Lista ordenável (drag & drop com `dnd-kit`)
  - Cada card: título + markdown editor
  - Toggle ativar/desativar
  - Botão adicionar nova instrução
  - Salvar como JSONB em `agentes.instrucoes`
3. **Form de Persona** ([`components/neurocore/PersonaForm.tsx`]):
  - Campos: nome_agente, persona, tom_voz, objetivo
  - Dropdown para `id_modelo_ia` (query em `ia_modelos`)
4. **Extrações** ([`components/neurocore/ExtractionsManager.tsx`]):
  - CRUD de `agente_extracoes`
  - Campos: informacao_para_extrair, descricao_para_ia, tipo_dado

**Biblioteca sugerida:**

- `@dnd-kit/core` + `@dnd-kit/sortable` para drag & drop
- `react-markdown` para preview

**Página:**

- [`app/(dashboard)/neurocore/editor/page.tsx`]

#### 7.2 Base de Conhecimento (RAG Manager)

**Componentes:**

1. **Domínios** ([`components/neurocore/DomainsManager.tsx`]):
  - Lista de `conhecimento_dominios`
  - CRUD: criar/editar domínio (pasta)
2. **Documentos** ([`components/neurocore/DocumentsList.tsx`]):
  - Lista de `base_conhecimento_geral` filtrada por domínio
  - Status de vetorização (Processando/Pronto)
  - Upload de arquivos (texto, PDF)
3. **Importador de Cobertura** ([`components/neurocore/CoverageImporter.tsx`]):
  - Upload CSV (CEP, Bairro, Cidade)
  - Parse e inserção em `conhecimento_cobertura`

**Página:**

- [`app/(dashboard)/neurocore/base-conhecimento/page.tsx`]

#### 7.3 Simulador (Playground)

**Componentes:**

1. **Chat Interface** ([`components/neurocore/Simulator.tsx`]):
  - Interface idêntica ao WhatsApp
  - Diferenciação: IA (verde), Cliente (branco)
  - Input para enviar mensagens
2. **Custo em Tempo Real** ([`components/neurocore/SimulatorCost.tsx`]):
  - "Custo desta sessão: R$ X,XX"
  - Calcular com base em tokens e modelo
3. **Debug Source** ([`components/neurocore/DebugSource.tsx`]):
  - Botão "Ver Fonte"
  - Modal mostrando trechos da base usados na resposta

**Integração:**

- Chamar função Supabase que invoca OpenAI
- Salvar em `usos_ia` para auditoria

**Página:**

- [`app/(dashboard)/neurocore/simulador/page.tsx`]

---

### 8. Módulo 5: Financeiro (Billing)

**Objetivo:** Gestão de créditos e transparência.

**Componentes principais:**

1. **Carteira** ([`components/financeiro/Wallet.tsx`]):
  - Card destacado com `saldo_creditos`
  - Alerta visual se < `alerta_saldo_baixo`
  - Fonte: `carteiras`
2. **Recarga** ([`components/financeiro/Recharge.tsx`]):
  - Chips com valores (R$ 50, 100, 200, 500, Custom)
  - Integração gateway (PIX/Boleto) - mock inicialmente
  - Salvar `gateway_customer_id` em `empresa`
3. **Extrato** ([`components/financeiro/Ledger.tsx`]):
  - Tabela de `carteiras_movimentacoes`
  - Colunas: Data, Descrição, Tipo, Valor, Saldo Após
  - Débitos em vermelho, créditos em verde
  - Link para `id_uso_referencia` (drill-down)
4. **Analytics de Consumo** ([`components/financeiro/ConsumptionChart.tsx`]):
  - Gráfico diário (últimos 30 dias)
  - Breakdown por fornecedor (OpenAI, ElevenLabs)
  - Fonte: `usos_ia` agrupado

**Página:**

- [`app/(dashboard)/financeiro/page.tsx`]

---

### 9. Módulo 6: Parâmetros (Configurações)

**Objetivo:** Configurações globais e integrações.

**Componentes principais:**

1. **Dados da Empresa** ([`components/parametros/CompanyForm.tsx`]):
  - Form com campos de `empresa` (CNPJ, nome, endereço, etc.)
  - Botão salvar
2. **Integração UpChat** ([`components/parametros/UpChatConfig.tsx`]):
  - Form para `configuracoes_upchat`:
    - Token, URL API, Queue ID
  - Botão "Testar Conexão" (chama endpoint de health check)
  - Indicador de status (verde/vermelho)
3. **Reativações** ([`components/parametros/ReactivationRules.tsx`]):
  - Lista de `regras_reativacao`
  - Form para adicionar: sequência, tempo_espera, tipo_acao, mensagem
  - Janela de horário: `horario_inicio_permitido`, `horario_fim_permitido`
4. **Habilidades Globais** ([`components/parametros/GlobalCapabilities.tsx`]):
  - Toggles: áudio, visão, simulação de digitação
  - Slider para `buffer_time`
  - Fonte: `empresa_preferencias_ia`

**Página:**

- [`app/(dashboard)/parametros/page.tsx`]

---

### 10. Módulo 4: Atendimento (Auditoria)

**Objetivo:** Monitoramento passivo de conversas (read-only).

**Componentes principais:**

1. **Lista de Conversas** ([`components/atendimento/ConversationsList.tsx`]):
  - Virtual scroll (react-window ou react-virtual)
  - Filtros: status (IA/Humano/Finalizado), data, busca
  - Fonte: `conversas`
2. **Chat Visual** ([`components/atendimento/ChatViewer.tsx`]):
  - Mensagens de `interacoes` agrupadas por `id_conversa`
  - Diferenciação: IA (verde), Cliente (branco), Humano (cinza)
  - Input bloqueado com barra "Modo Espectador"
  - Link para abrir no UpChat
3. **Contexto Lateral** ([`components/atendimento/ContextPanel.tsx`]):
  - Dados de `pessoas_dados_qualificacao`
  - Exibir: chave, valor, confiança, origem

**Página:**

- [`app/(dashboard)/atendimento/page.tsx`]

---

## Fase 2: Módulos Complementares

### 11. Módulo 7: Treinamento Inicial (Onboarding)

**Wizard multi-etapas:**

1. Empresa
2. Contatos
3. Redes Sociais
4. Planos PF
5. Planos PJ
6. Lojas
7. Cobertura
8. FAQs
9. Contrato/Taxas
10. Outras Instruções

**Componentes:**

- [`components/onboarding/OnboardingWizard.tsx`]
- Steps com navegação
- Salvar em `agentes_treinamento_inicial`
- Status: RASCUNHO/PUBLICADO

**Página:**

- [`app/(dashboard)/onboarding/page.tsx`]

---

### 12. Módulo 8: Usuários e Acessos

**Componentes:**

1. **Lista de Usuários** ([`components/usuarios/UsersList.tsx`]):
  - Tabela de `usuarios_sofhia`
  - Colunas: Nome, Email, Status, Data Criação
2. **Ativar/Desativar** ([`components/usuarios/UserActions.tsx`]):
  - Toggle com confirmação
  - Atualizar campo `ativo`
3. **Convite** ([`components/usuarios/InviteUser.tsx`]):
  - Form para email
  - Criar usuário via Supabase Admin API

**Página:**

- [`app/(dashboard)/usuarios/page.tsx`]

---

### 13. Módulo 9: Integrações

**Componentes:**

1. **Catálogo** ([`components/integracoes/Catalog.tsx`]):
  - Cards de `integracoes_catalogo`
  - Exibir: logo, nome, descrição, docs
2. **Minhas Integrações** ([`components/integracoes/MyIntegrations.tsx`]):
  - Lista de `empresa_integracoes`
  - Status ativo/inativo
3. **Configuração** ([`components/integracoes/IntegrationConfig.tsx`]):
  - Form dinâmico baseado em `schema_config_json`
  - Salvar em `config_credenciais` (criptografado)

**Página:**

- [`app/(dashboard)/integracoes/page.tsx`]

---

### 14. Módulo 10: Tags e Gatilhos

**Componentes:**

1. **Gestão de Tags** ([`components/tags/TagsManager.tsx`]):
  - CRUD de `tags`
  - Color picker para `cor_hex`
2. **Gatilhos** ([`components/tags/TriggerManager.tsx`]):
  - Configurar `tags_gatilhos`
  - Mapear integração ou webhook custom

**Página:**

- [`app/(dashboard)/tags/page.tsx`]

---

## Fase 3: Módulos Avançados

### 15. Módulo 11: Experimentos A/B

**Componentes:**

- Criar experimento
- Grupos e distribuição
- Métricas e histórico

**Tabelas:** `experimentos_ab`, `historico_experimentos_ab`

---

### 16. Módulo 12: Guardrails (Segurança da IA)

**Componentes:**

- Editor de prompts de segurança
- Teste rápido de jailbreak

**Tabela:** `agentes_guardrails`

---

### 17. Módulo 13: Modelos de IA

**Componentes:**

- Catálogo de `ia_modelos`
- Seleção no agente
- Estimativa de custo

---

### 18. Módulo 14: Notificações

**Componentes:**

- Caixa de entrada de alertas
- Filtros por tipo e status

**Tabela:** `financeiro_notificacoes`

---

### 19. Módulo 15: Qualidade (Feedback)

**Componentes:**

- Lista de feedbacks
- Link para conversa relacionada

**Tabela:** `feedback_mensagens`

---

### 20. Módulo 16: Vendas e Contratos

**Componentes:**

- Lista de vendas
- Detalhe do contrato
- Ações de status

**Tabela:** `vendas_contratos`

---

### 21. Módulo 17: Pessoas (CRM Leve)

**Componentes:**

- Listagem e busca
- Perfil com histórico

**Tabelas:** `pessoas`, `pessoas_dados_qualificacao`

---

### 22. Módulo 18: Consumo Detalhado

**Componentes:**

- Tabela de auditoria de `usos_ia`
- Drill-down por conversa

---

## Design System e Padrões

### Bibliotecas de Componentes

**Instalar Shadcn/UI:**

```bash
npx shadcn-ui@latest init
```

**Componentes principais a adicionar:**

- Button, Card, Badge, Table, Dialog, Select, Input
- Dropdown Menu, Tabs, Toggle, Slider
- Sheet (sidebar mobile)

### Componentes Customizados

**Criar biblioteca interna:**

1. **KPICard** ([`components/ui/KPICard.tsx`]):
  - Layout padrão para métricas
  - Ícone + título + valor + variação
2. **StatusBadge** ([`components/ui/StatusBadge.tsx`]):
  - Cores semânticas automáticas
  - Variantes: success, warning, error, info
3. **DataTable** ([`components/ui/DataTable.tsx`]):
  - Wrapper do Shadcn Table
  - Ordenação, paginação, filtros integrados
4. **ConfirmModal** ([`components/ui/ConfirmModal.tsx`]):
  - Modal de confirmação reutilizável
  - Suporte a confirmação por texto digitado

### Gráficos

**Biblioteca: Recharts**

```bash
npm install recharts
```

**Componentes:**

- [`components/charts/AreaChart.tsx`]
- [`components/charts/BarChart.tsx`]
- [`components/charts/Heatmap.tsx`]

---

## State Management e Data Fetching

### React Query

**Setup:**

```bash
npm install @tanstack/react-query
```

**Provider:** [`app/providers.tsx`]

**Padrão de hooks:**

```typescript
// lib/hooks/useDashboardKPIs.ts
export function useDashboardKPIs(idEmpresa: string) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', idEmpresa],
    queryFn: () => fetchDashboardKPIs(idEmpresa),
    staleTime: 30000, // 30s
  });
}
```

---

## Testing Strategy

### Testes de Componentes (Opcional MVP)

**Setup:**

- Jest + React Testing Library
- Vitest (alternativa mais rápida)

**Prioridade:**

- Componentes críticos (auth, recarga)
- Fluxos sensíveis (confirmações)

---

## Deploy e Infraestrutura

### Vercel (Recomendado)

1. Conectar repositório
2. Configurar env vars (Supabase URL, keys)
3. Deploy automático em push

### Supabase

- Projeto em produção
- Backups automáticos
- Monitoramento de queries

---

## Roadmap de Entrega

### Sprint 1 (Semana 1-2): Fundação

- Setup projeto
- Supabase + DB
- Auth
- Layout principal
- Dashboard básico

### Sprint 2 (Semana 3-4): Core MVP

- Monitoramento
- Neurocore (Editor + Simulador)
- Financeiro (Carteira + Recarga)
- Parâmetros

### Sprint 3 (Semana 5-6): Complementos MVP

- Atendimento
- Base de Conhecimento
- Refinamentos UI/UX

### Sprint 4+ (Semana 7+): Módulos Avançados

- Onboarding
- Usuários
- Integrações
- Tags e Gatilhos
- Experimentos A/B
- Guardrails
- Analytics avançados

---

## Critérios de Aceite (Validação MVP)

- Usuário cria conta e faz login com sucesso
- Dashboard exibe KPIs e gráficos com dados reais
- Monitoramento mostra status do UpChat (verde/vermelho)
- Editor de Agente permite criar/editar com drag & drop
- Simulador responde perguntas baseado na base de conhecimento
- Usuário realiza recarga e saldo atualiza em tempo real
- Parâmetros salvam configurações do UpChat
- Interface é responsiva e funcional em mobile
- Performance: Dashboard carrega em < 2s
- Segurança: RLS impede acesso cross-tenant

---

## Pontos de Atenção

### Segurança

- **RLS obrigatório** em todas as tabelas
- Nunca expor chaves de API no frontend
- Validar input em todas as forms
- Sanitizar markdown/HTML

### Performance

- Virtual scroll em listas grandes (Atendimento)
- Lazy loading de módulos
- Otimizar queries (índices no Supabase)
- Cache agressivo com React Query

### UX

- Loading states (skeleton)
- Estados vazios orientados
- Feedback imediato em ações
- Confirmação em ações críticas

### Acessibilidade

- Contraste WCAG AA
- Navegação por teclado
- Labels em todos inputs
- Ícones + texto (não só cor)

---

## Decisões Pendentes

1. **Modo escuro**: implementar ou não? (Sugestão: sim, fintech moderno)
2. **Biblioteca de charts**: Recharts ou alternativa (Chart.js, Victory)?
3. **Design tokens**: padronizar spacing/radius/shadow em arquivo central?
4. **Permissões/Roles**: sistema de roles granular ou apenas owner/admin?
5. **Gateway de pagamento**: qual usar (Stripe, Asaas, PagSeguro)?
6. **Notificações em tempo real**: Supabase Realtime ou polling?

---

## Recursos e Referências

- **Next.js Docs**: https://nextjs.org/docs
- **Shadcn/UI**: https://ui.shadcn.com
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Query**: https://tanstack.com/query/latest
- **Lucide Icons**: https://lucide.dev
- **Recharts**: https://recharts.org
