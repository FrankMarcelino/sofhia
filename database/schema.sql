-- ============================================================================
-- SOFHIA Enterprise - Database Schema v3.5
-- ============================================================================
-- 
-- Este script cria todas as tabelas, tipos ENUM e relacionamentos necessários
-- para a aplicação SOFHIA Enterprise.
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
--
-- Ordem de execução:
-- 1. Criar tipos ENUM customizados
-- 2. Criar tabelas base (sem foreign keys)
-- 3. Criar tabelas dependentes
-- 4. Criar índices
--
-- ============================================================================

-- ============================================================================
-- PARTE 1: TIPOS ENUM CUSTOMIZADOS
-- ============================================================================

-- Tipos de dados para extrações
CREATE TYPE "TIPO_DADO" AS ENUM ('string', 'number', 'boolean', 'date', 'json');

-- Status de publicação
CREATE TYPE "STATUS_PUBLICACAO" AS ENUM ('RASCUNHO', 'PUBLICADO');

-- Status de treinamento
CREATE TYPE "STATUS_TREINAMENTO_INICIAL" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO');

-- Status de conversa
CREATE TYPE "CONVERSA_STATUS" AS ENUM ('conversando', 'pausado', 'encerrado', 'aguardando_humano');

-- Motivo da conversa
CREATE TYPE "MOTIVO_CONVERSA" AS ENUM ('NAO_IDENTIFICADO', 'VENDA', 'SUPORTE', 'DUVIDA', 'CANCELAMENTO', 'OUTRO');

-- Status de empresa
CREATE TYPE "EMPRESA_STATUS" AS ENUM ('ATIVO', 'INATIVO', 'SUSPENSO');

-- Tipo de operação financeira
CREATE TYPE "TIPO_OPERACAO" AS ENUM ('CREDITO', 'DEBITO');

-- Tipo de ação de reativação
CREATE TYPE "TIPO_ACAO_REATIVACAO" AS ENUM ('MENSAGEM', 'TRANSBORDO');

-- Tipo de alerta financeiro
CREATE TYPE "TIPO_ALERTA_FINANCEIRO" AS ENUM ('SALDO_BAIXO', 'SALDO_ZERADO', 'USO_ELEVADO', 'RECARGA_APROVADA');

-- Avaliação de feedback
CREATE TYPE "AVALIACAO" AS ENUM ('POSITIVO', 'NEGATIVO', 'NEUTRO');

-- Status de contrato
CREATE TYPE "STATUS_CONTRATO" AS ENUM ('PENDENTE', 'APROVADO', 'ATIVO', 'CANCELADO', 'SUSPENSO');

-- Tipo de plano
CREATE TYPE "TIPO_PLANO" AS ENUM ('MENSAL_FIXO', 'PRE_PAGO', 'CREDITOS');

-- ============================================================================
-- PARTE 2: TABELAS BASE (sem foreign keys complexas)
-- ============================================================================

-- Neurocores (sistema base)
CREATE TABLE public.neurocores (
  id_neurocore uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  nome text NOT NULL,
  descricao text,
  n8n_workflow_id_mestre text,
  ativo boolean DEFAULT true,
  CONSTRAINT neurocores_pkey PRIMARY KEY (id_neurocore)
);

-- Planos de assinatura
CREATE TABLE public.planos (
  id_plano uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo "TIPO_PLANO" NOT NULL DEFAULT 'MENSAL_FIXO'::"TIPO_PLANO",
  creditos_mensais numeric DEFAULT 0,
  permite_acumular boolean DEFAULT false,
  valor_mensalidade numeric,
  ativo boolean DEFAULT true,
  CONSTRAINT planos_pkey PRIMARY KEY (id_plano)
);

-- Modelos de IA disponíveis
CREATE TABLE public.ia_modelos (
  id_modelo text NOT NULL,
  nome_exibicao text NOT NULL,
  provedor text NOT NULL,
  custo_input_por_1m numeric NOT NULL DEFAULT 0,
  custo_output_por_1m numeric NOT NULL DEFAULT 0,
  context_window integer,
  ativo boolean DEFAULT true,
  CONSTRAINT ia_modelos_pkey PRIMARY KEY (id_modelo)
);

-- Catálogo de integrações disponíveis
CREATE TABLE public.integracoes_catalogo (
  slug text NOT NULL,
  nome text NOT NULL,
  descricao text,
  logo_url text,
  docs_url text,
  schema_config_json jsonb DEFAULT '[]'::jsonb,
  ativo boolean DEFAULT true,
  CONSTRAINT integracoes_catalogo_pkey PRIMARY KEY (slug)
);

-- ============================================================================
-- PARTE 3: TABELAS DE EMPRESA E USUÁRIOS
-- ============================================================================

-- Empresas (Tenants)
CREATE TABLE public.empresa (
  id_empresa uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  nome text NOT NULL,
  cnpj text,
  endereco text,
  cidade text,
  telefone text,
  site text,
  instagram text,
  email text,
  status_empresa "EMPRESA_STATUS" DEFAULT 'ATIVO'::"EMPRESA_STATUS",
  id_plano uuid,
  id_neurocore uuid,
  sites_outros_sites text[],
  CONSTRAINT empresa_pkey PRIMARY KEY (id_empresa),
  CONSTRAINT empresa_plano_fk FOREIGN KEY (id_plano) REFERENCES public.planos(id_plano),
  CONSTRAINT empresa_neurocore_fk FOREIGN KEY (id_neurocore) REFERENCES public.neurocores(id_neurocore)
);

-- Usuários da aplicação (vinculados ao Supabase Auth)
CREATE TABLE public.usuarios_sofhia (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  nome_usuario text,
  ativo boolean DEFAULT true,
  CONSTRAINT usuarios_sofhia_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_sofhia_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT usuarios_sofhia_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- ============================================================================
-- PARTE 4: TABELAS DE AGENTES E IA
-- ============================================================================

-- Tipos de agentes
CREATE TABLE public.agentes_tipos (
  id_agentes_tipos uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_neurocore uuid NOT NULL,
  tipo_agente text NOT NULL,
  display text,
  CONSTRAINT agentes_tipos_pkey PRIMARY KEY (id_agentes_tipos),
  CONSTRAINT agentes_tipos_neurocore_fk FOREIGN KEY (id_neurocore) REFERENCES public.neurocores(id_neurocore)
);

-- Agentes de IA
CREATE TABLE public.agentes (
  id_agente uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  id_neurocore uuid NOT NULL,
  id_tipo_agente uuid NOT NULL,
  nome_agente text NOT NULL,
  persona text NOT NULL,
  tom_voz text NOT NULL,
  objetivo text NOT NULL,
  instrucoes jsonb DEFAULT '[]'::jsonb,
  limitacoes jsonb DEFAULT '[]'::jsonb,
  roteiro jsonb DEFAULT '[]'::jsonb,
  meio_comunicacao text,
  ativo boolean DEFAULT false,
  nome_agente_identificador text,
  sexo_agente text,
  id_modelo_ia text NOT NULL DEFAULT 'gpt-4o'::text,
  grupo_teste_ab text,
  peso_distribuicao integer DEFAULT 1 CHECK (peso_distribuicao >= 1),
  total_atendimentos_ab integer DEFAULT 0,
  CONSTRAINT agentes_pkey PRIMARY KEY (id_agente),
  CONSTRAINT agentes_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT agentes_neurocore_fk FOREIGN KEY (id_neurocore) REFERENCES public.neurocores(id_neurocore),
  CONSTRAINT agentes_tipo_fk FOREIGN KEY (id_tipo_agente) REFERENCES public.agentes_tipos(id_agentes_tipos),
  CONSTRAINT agentes_modelo_fk FOREIGN KEY (id_modelo_ia) REFERENCES public.ia_modelos(id_modelo)
);

-- Extrações de dados dos agentes
CREATE TABLE public.agente_extracoes (
  id_agente_extracoes uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_agente uuid NOT NULL,
  informacao_para_extrair text NOT NULL,
  descricao_para_ia text NOT NULL,
  tipo_dado "TIPO_DADO" NOT NULL DEFAULT 'string'::"TIPO_DADO",
  CONSTRAINT agente_extracoes_pkey PRIMARY KEY (id_agente_extracoes),
  CONSTRAINT agente_extracoes_id_agente_fkey FOREIGN KEY (id_agente) REFERENCES public.agentes(id_agente) ON DELETE CASCADE
);

-- Guardrails de segurança para agentes
CREATE TABLE public.agentes_guardrails (
  id_guardrail uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  id_agente uuid,
  prompt_seguranca text,
  prompt_bloqueio_jailbreak text,
  ativo boolean DEFAULT true,
  CONSTRAINT agentes_guardrails_pkey PRIMARY KEY (id_guardrail),
  CONSTRAINT guardrails_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT guardrails_agente_fk FOREIGN KEY (id_agente) REFERENCES public.agentes(id_agente) ON DELETE CASCADE
);

-- Treinamento inicial dos agentes
CREATE TABLE public.agentes_treinamento_inicial (
  id_agente_treinamento_inicial uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL UNIQUE,
  status_publicacao "STATUS_PUBLICACAO" DEFAULT 'RASCUNHO'::"STATUS_PUBLICACAO",
  sites jsonb DEFAULT '[]'::jsonb,
  telefones jsonb DEFAULT '[]'::jsonb,
  redes_sociais jsonb DEFAULT '[]'::jsonb,
  sobre_empresa text,
  planos_pf jsonb DEFAULT '[]'::jsonb,
  planos_pj jsonb DEFAULT '[]'::jsonb,
  lojas jsonb DEFAULT '[]'::jsonb,
  areas_cobertura jsonb DEFAULT '[]'::jsonb,
  perguntas_frequentes jsonb DEFAULT '[]'::jsonb,
  contrato text,
  taxa_instalacao_prazos text,
  outras_instrucoes text,
  mensagem_para_treinador text,
  status_treinamento_inicial "STATUS_TREINAMENTO_INICIAL" NOT NULL DEFAULT 'ABERTO'::"STATUS_TREINAMENTO_INICIAL",
  status_configuracao_inicial "STATUS_TREINAMENTO_INICIAL" NOT NULL DEFAULT 'ABERTO'::"STATUS_TREINAMENTO_INICIAL",
  CONSTRAINT agentes_treinamento_inicial_pkey PRIMARY KEY (id_agente_treinamento_inicial),
  CONSTRAINT agentes_treinamento_inicial_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- ============================================================================
-- PARTE 5: BASE DE CONHECIMENTO
-- ============================================================================

-- Domínios de conhecimento (pastas)
CREATE TABLE public.conhecimento_dominios (
  id_dominio uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  CONSTRAINT conhecimento_dominios_pkey PRIMARY KEY (id_dominio),
  CONSTRAINT conhecimento_dominios_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- Base de conhecimento geral (RAG)
CREATE TABLE public.base_conhecimento_geral (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  id_dominio uuid,
  titulo text,
  conteudo text NOT NULL,
  embedding vector,
  CONSTRAINT base_conhecimento_geral_pkey PRIMARY KEY (id),
  CONSTRAINT base_geral_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT base_geral_dominio_fk FOREIGN KEY (id_dominio) REFERENCES public.conhecimento_dominios(id_dominio) ON DELETE SET NULL
);

-- Conhecimento de cobertura (CEP/Bairros)
CREATE TABLE public.conhecimento_cobertura (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  cep text,
  bairro text,
  cidade text,
  status_disponibilidade boolean DEFAULT true,
  embedding vector,
  CONSTRAINT conhecimento_cobertura_pkey PRIMARY KEY (id),
  CONSTRAINT base_cobertura_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- ============================================================================
-- PARTE 6: PESSOAS (CRM)
-- ============================================================================

-- Pessoas (Leads/Clientes)
CREATE TABLE public.pessoas (
  id_pessoa uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  nome text,
  identificador_para_mensageiros text,
  telefone text,
  email text,
  cpf text,
  rg text,
  cnpj text,
  endereco text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  observacoes text,
  ultimo_queue_id text,
  CONSTRAINT pessoas_pkey PRIMARY KEY (id_pessoa),
  CONSTRAINT pessoas_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- Dados de qualificação extraídos pela IA
CREATE TABLE public.pessoas_dados_qualificacao (
  id_dado uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  id_pessoa uuid NOT NULL,
  id_conversa uuid,
  chave text NOT NULL,
  valor text,
  confianca_ia integer DEFAULT 100 CHECK (confianca_ia >= 0 AND confianca_ia <= 100),
  origem_dado text DEFAULT 'IA_CONVERSA'::text,
  CONSTRAINT pessoas_dados_qualificacao_pkey PRIMARY KEY (id_dado),
  CONSTRAINT dados_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT dados_pessoa_fk FOREIGN KEY (id_pessoa) REFERENCES public.pessoas(id_pessoa) ON DELETE CASCADE
);

-- ============================================================================
-- PARTE 7: CONVERSAS E INTERAÇÕES
-- ============================================================================

-- Conversas
CREATE TABLE public.conversas (
  id_conversa uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  id_pessoa uuid NOT NULL,
  id_agente_atendente uuid,
  status_conversa "CONVERSA_STATUS" NOT NULL DEFAULT 'conversando'::"CONVERSA_STATUS",
  motivo_da_conversa "MOTIVO_CONVERSA" NOT NULL DEFAULT 'NAO_IDENTIFICADO'::"MOTIVO_CONVERSA",
  encerrada boolean DEFAULT false,
  data_ultima_interacao timestamp with time zone NOT NULL DEFAULT now(),
  pausar_motivo text,
  encerrar_motivo text,
  reativacao_numero integer DEFAULT 0,
  CONSTRAINT conversas_pkey PRIMARY KEY (id_conversa),
  CONSTRAINT conversas_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT conversas_pessoa_fk FOREIGN KEY (id_pessoa) REFERENCES public.pessoas(id_pessoa),
  CONSTRAINT conversas_id_agente_fkey FOREIGN KEY (id_agente_atendente) REFERENCES public.agentes(id_agente)
);

-- Adicionar foreign key de conversa em pessoas_dados_qualificacao
ALTER TABLE public.pessoas_dados_qualificacao
ADD CONSTRAINT dados_conversa_fk FOREIGN KEY (id_conversa) REFERENCES public.conversas(id_conversa) ON DELETE SET NULL;

-- Interações (mensagens)
CREATE TABLE public.interacoes (
  id_interacao uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_conversa uuid NOT NULL,
  remetente text NOT NULL,
  mensagem_texto text,
  tipo_mensagem text DEFAULT 'text'::text,
  CONSTRAINT interacoes_pkey PRIMARY KEY (id_interacao),
  CONSTRAINT interacoes_id_conversa_fkey FOREIGN KEY (id_conversa) REFERENCES public.conversas(id_conversa) ON DELETE CASCADE
);

-- Tags para conversas
CREATE TABLE public.tags (
  id_tag uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  nome text NOT NULL,
  cor_hex text DEFAULT '#000000'::text,
  descricao_para_ia text,
  CONSTRAINT tags_pkey PRIMARY KEY (id_tag),
  CONSTRAINT tags_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- Relação conversas <> tags
CREATE TABLE public.conversas_tags (
  id_conversa_tag uuid NOT NULL DEFAULT gen_random_uuid(),
  id_conversa uuid NOT NULL,
  id_tag uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversas_tags_pkey PRIMARY KEY (id_conversa_tag),
  CONSTRAINT ct_conversa_fk FOREIGN KEY (id_conversa) REFERENCES public.conversas(id_conversa) ON DELETE CASCADE,
  CONSTRAINT ct_tag_fk FOREIGN KEY (id_tag) REFERENCES public.tags(id_tag) ON DELETE CASCADE
);

-- Feedback de mensagens
CREATE TABLE public.feedback_mensagens (
  id_feedback uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_interacao uuid NOT NULL,
  avaliacao "AVALIACAO",
  comentario text,
  usuario_avaliador text,
  CONSTRAINT feedback_mensagens_pkey PRIMARY KEY (id_feedback),
  CONSTRAINT feedback_interacao_fk FOREIGN KEY (id_interacao) REFERENCES public.interacoes(id_interacao) ON DELETE CASCADE
);

-- ============================================================================
-- PARTE 8: VENDAS E CONTRATOS
-- ============================================================================

-- Vendas e contratos
CREATE TABLE public.vendas_contratos (
  id_venda uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  id_pessoa uuid NOT NULL,
  id_conversa uuid,
  id_agente_vendedor uuid,
  nome_servico text NOT NULL,
  valor_mensal numeric,
  status_contrato "STATUS_CONTRATO" NOT NULL DEFAULT 'PENDENTE'::"STATUS_CONTRATO",
  CONSTRAINT vendas_contratos_pkey PRIMARY KEY (id_venda),
  CONSTRAINT vendas_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT vendas_pessoa_fk FOREIGN KEY (id_pessoa) REFERENCES public.pessoas(id_pessoa),
  CONSTRAINT vendas_conversa_fk FOREIGN KEY (id_conversa) REFERENCES public.conversas(id_conversa) ON DELETE SET NULL,
  CONSTRAINT vendas_agente_fk FOREIGN KEY (id_agente_vendedor) REFERENCES public.agentes(id_agente) ON DELETE SET NULL
);

-- ============================================================================
-- PARTE 9: FINANCEIRO
-- ============================================================================

-- Carteiras (créditos)
CREATE TABLE public.carteiras (
  id_carteira uuid NOT NULL DEFAULT gen_random_uuid(),
  id_empresa uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  saldo_creditos numeric NOT NULL DEFAULT 0,
  limite_cheque_especial numeric DEFAULT 0,
  alerta_saldo_baixo numeric DEFAULT 50,
  data_ultima_renovacao timestamp with time zone,
  ativo boolean DEFAULT true,
  CONSTRAINT carteiras_pkey PRIMARY KEY (id_carteira),
  CONSTRAINT carteiras_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- Usos de IA (para cobrança)
CREATE TABLE public.usos_ia (
  id_uso bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  id_agente uuid,
  id_conversa uuid,
  id_modelo text,
  tokens_total integer DEFAULT 0 CHECK (tokens_total >= 0),
  custo_total_usd numeric,
  CONSTRAINT usos_ia_pkey PRIMARY KEY (id_uso),
  CONSTRAINT usos_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT usos_agente_fk FOREIGN KEY (id_agente) REFERENCES public.agentes(id_agente) ON DELETE SET NULL,
  CONSTRAINT usos_modelo_fk FOREIGN KEY (id_modelo) REFERENCES public.ia_modelos(id_modelo)
);

-- Movimentações da carteira
CREATE TABLE public.carteiras_movimentacoes (
  id_movimentacao uuid NOT NULL DEFAULT gen_random_uuid(),
  id_carteira uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  tipo_operacao "TIPO_OPERACAO" NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0::numeric),
  saldo_apos numeric NOT NULL,
  descricao text,
  id_uso_referencia bigint,
  CONSTRAINT carteiras_movimentacoes_pkey PRIMARY KEY (id_movimentacao),
  CONSTRAINT movimentacoes_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT mov_fk_carteira FOREIGN KEY (id_carteira) REFERENCES public.carteiras(id_carteira),
  CONSTRAINT mov_fk_uso_ia FOREIGN KEY (id_uso_referencia) REFERENCES public.usos_ia(id_uso) ON DELETE SET NULL
);

-- Notificações financeiras
CREATE TABLE public.financeiro_notificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  tipo_alerta "TIPO_ALERTA_FINANCEIRO",
  titulo text,
  mensagem text,
  status text DEFAULT 'PENDENTE'::text,
  canais_envio text[] DEFAULT '{whatsapp,email}'::text[],
  data_envio timestamp with time zone,
  CONSTRAINT financeiro_notificacoes_pkey PRIMARY KEY (id),
  CONSTRAINT fin_notificacoes_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- ============================================================================
-- PARTE 10: INTEGRAÇÕES E CONFIGURAÇÕES
-- ============================================================================

-- Integrações da empresa
CREATE TABLE public.empresa_integracoes (
  id_empresa_integracao uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  slug_integracao text NOT NULL,
  nome_identificacao text,
  config_credenciais jsonb DEFAULT '{}'::jsonb,
  ativo boolean DEFAULT true,
  CONSTRAINT empresa_integracoes_pkey PRIMARY KEY (id_empresa_integracao),
  CONSTRAINT emp_int_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT emp_int_slug_fk FOREIGN KEY (slug_integracao) REFERENCES public.integracoes_catalogo(slug)
);

-- Gatilhos por tags
CREATE TABLE public.tags_gatilhos (
  id_gatilho uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  id_tag uuid NOT NULL,
  id_empresa_integracao uuid,
  webhook_url_custom text,
  ativo boolean DEFAULT true,
  CONSTRAINT tags_gatilhos_pkey PRIMARY KEY (id_gatilho),
  CONSTRAINT tags_gatilhos_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa),
  CONSTRAINT tags_gatilhos_tag_fk FOREIGN KEY (id_tag) REFERENCES public.tags(id_tag) ON DELETE CASCADE,
  CONSTRAINT tags_gatilhos_int_fk FOREIGN KEY (id_empresa_integracao) REFERENCES public.empresa_integracoes(id_empresa_integracao) ON DELETE SET NULL
);

-- Configurações UpChat
CREATE TABLE public.configuracoes_upchat (
  id_config uuid NOT NULL DEFAULT gen_random_uuid(),
  id_empresa uuid NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company_name text,
  api_global_token_upchat text NOT NULL,
  url_provedor_upchat text,
  url_socket_upchat text,
  porta_servidor_integracao text,
  url_eventos_upchat text,
  usuario_upchat text,
  senha_upchat text,
  url_envio_sofhia text,
  queue_id text,
  CONSTRAINT configuracoes_upchat_pkey PRIMARY KEY (id_config),
  CONSTRAINT configuracoes_upchat_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- Preferências de IA da empresa
CREATE TABLE public.empresa_preferencias_ia (
  id_preferencia uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL UNIQUE,
  transcrever_audio_cliente boolean DEFAULT true,
  responder_em_audio_se_receber_audio boolean DEFAULT false,
  extrair_dados_documentos boolean DEFAULT true,
  simular_digitacao boolean DEFAULT true,
  tempo_medio_digitacao_segundos integer DEFAULT 3,
  maximo_tentativas_ia integer DEFAULT 3,
  transbordo_automatico_erro boolean DEFAULT true,
  nome_fila_transbordo text,
  assinatura_texto text,
  buffer_time integer NOT NULL DEFAULT 9,
  CONSTRAINT empresa_preferencias_ia_pkey PRIMARY KEY (id_preferencia),
  CONSTRAINT preferencias_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- Regras de reativação
CREATE TABLE public.regras_reativacao (
  id_regra uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  sequencia integer NOT NULL DEFAULT 1 CHECK (sequencia > 0),
  tempo_espera_minutos integer NOT NULL CHECK (tempo_espera_minutos >= 0),
  tipo_acao "TIPO_ACAO_REATIVACAO" NOT NULL,
  mensagem_texto text,
  ativo boolean DEFAULT true,
  CONSTRAINT regras_reativacao_pkey PRIMARY KEY (id_regra),
  CONSTRAINT regras_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- ============================================================================
-- PARTE 11: EXPERIMENTOS A/B
-- ============================================================================

-- Experimentos A/B
CREATE TABLE public.experimentos_ab (
  id_experimento uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id_empresa uuid NOT NULL,
  nome_grupo text NOT NULL,
  versao_atual integer DEFAULT 1 CHECK (versao_atual >= 1),
  descricao_hipotese text,
  ativo boolean DEFAULT true,
  CONSTRAINT experimentos_ab_pkey PRIMARY KEY (id_experimento),
  CONSTRAINT experimentos_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- Histórico de experimentos A/B
CREATE TABLE public.historico_experimentos_ab (
  id_historico uuid NOT NULL DEFAULT gen_random_uuid(),
  data_fechamento timestamp with time zone DEFAULT now(),
  id_experimento uuid NOT NULL,
  id_empresa uuid NOT NULL,
  versao_ciclo integer NOT NULL,
  nome_agente text,
  total_atendimentos integer,
  total_conversoes integer,
  taxa_conversao numeric,
  CONSTRAINT historico_experimentos_ab_pkey PRIMARY KEY (id_historico),
  CONSTRAINT historico_experimento_fk FOREIGN KEY (id_experimento) REFERENCES public.experimentos_ab(id_experimento) ON DELETE CASCADE,
  CONSTRAINT historico_empresa_fk FOREIGN KEY (id_empresa) REFERENCES public.empresa(id_empresa)
);

-- ============================================================================
-- PARTE 12: ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices em tabelas principais
CREATE INDEX idx_usuarios_empresa ON public.usuarios_sofhia(id_empresa);
CREATE INDEX idx_agentes_empresa ON public.agentes(id_empresa);
CREATE INDEX idx_conversas_empresa ON public.conversas(id_empresa);
CREATE INDEX idx_conversas_pessoa ON public.conversas(id_pessoa);
CREATE INDEX idx_conversas_status ON public.conversas(status_conversa);
CREATE INDEX idx_interacoes_conversa ON public.interacoes(id_conversa);
CREATE INDEX idx_pessoas_empresa ON public.pessoas(id_empresa);
CREATE INDEX idx_pessoas_telefone ON public.pessoas(telefone);
CREATE INDEX idx_vendas_empresa ON public.vendas_contratos(id_empresa);
CREATE INDEX idx_vendas_pessoa ON public.vendas_contratos(id_pessoa);
CREATE INDEX idx_usos_ia_empresa ON public.usos_ia(id_empresa);
CREATE INDEX idx_movimentacoes_carteira ON public.carteiras_movimentacoes(id_carteira);
CREATE INDEX idx_base_conhecimento_empresa ON public.base_conhecimento_geral(id_empresa);
CREATE INDEX idx_base_conhecimento_dominio ON public.base_conhecimento_geral(id_dominio);

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- Após executar este script:
-- 1. Execute rls_policies.sql para configurar Row Level Security
-- 2. Execute rpc_functions.sql para criar funções auxiliares
-- 3. (Opcional) Execute seed.sql para dados iniciais
