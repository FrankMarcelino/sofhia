-- ============================================================================
-- SOFHIA Enterprise - Row Level Security (RLS) Policies
-- ============================================================================
-- 
-- Este script configura políticas de segurança multi-tenant.
-- Cada empresa só pode acessar seus próprios dados.
--
-- IMPORTANTE: Execute APÓS o schema.sql
-- 
-- IDEMPOTENTE: Este script pode ser executado múltiplas vezes sem erros.
-- Todas as políticas são removidas e recriadas.
--
-- ============================================================================

-- ============================================================================
-- PARTE 1: HABILITAR RLS EM TODAS AS TABELAS SENSÍVEIS
-- ============================================================================

-- Tabelas de Empresa e Usuários
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_sofhia ENABLE ROW LEVEL SECURITY;

-- Tabelas de Agentes
ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_extracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agentes_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agentes_treinamento_inicial ENABLE ROW LEVEL SECURITY;

-- Tabelas de Conhecimento
ALTER TABLE public.conhecimento_dominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_conhecimento_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conhecimento_cobertura ENABLE ROW LEVEL SECURITY;

-- Tabelas de Pessoas
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pessoas_dados_qualificacao ENABLE ROW LEVEL SECURITY;

-- Tabelas de Conversas
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_mensagens ENABLE ROW LEVEL SECURITY;

-- Tabelas de Vendas
ALTER TABLE public.vendas_contratos ENABLE ROW LEVEL SECURITY;

-- Tabelas Financeiras
ALTER TABLE public.carteiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carteiras_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usos_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_notificacoes ENABLE ROW LEVEL SECURITY;

-- Tabelas de Integrações
ALTER TABLE public.empresa_integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags_gatilhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_upchat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_preferencias_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_reativacao ENABLE ROW LEVEL SECURITY;

-- Tabelas de Experimentos
ALTER TABLE public.experimentos_ab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_experimentos_ab ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 2: FUNÇÃO AUXILIAR PARA OBTER ID DA EMPRESA DO USUÁRIO LOGADO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id_empresa FROM public.usuarios_sofhia WHERE id = auth.uid();
$$;

-- Função auxiliar para obter id_neurocore da empresa do usuário
CREATE OR REPLACE FUNCTION public.user_neurocore_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT e.id_neurocore
  FROM public.empresa e
  JOIN public.usuarios_sofhia u ON u.id_empresa = e.id_empresa
  WHERE u.id = auth.uid();
$$;

-- ============================================================================
-- PARTE 3: POLÍTICAS DE SELECT (Leitura)
-- ============================================================================

-- Empresa: Usuário só vê sua própria empresa
DROP POLICY IF EXISTS "usuarios_veem_propria_empresa" ON public.empresa;
CREATE POLICY "usuarios_veem_propria_empresa" ON public.empresa
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Usuários: Usuário vê apenas usuários da mesma empresa
DROP POLICY IF EXISTS "usuarios_veem_colegas" ON public.usuarios_sofhia;
CREATE POLICY "usuarios_veem_colegas" ON public.usuarios_sofhia
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Agentes: Usuário vê apenas agentes da sua empresa
DROP POLICY IF EXISTS "usuarios_veem_agentes_empresa" ON public.agentes;
CREATE POLICY "usuarios_veem_agentes_empresa" ON public.agentes
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Extrações de agentes
DROP POLICY IF EXISTS "usuarios_veem_extracoes_empresa" ON public.agente_extracoes;
CREATE POLICY "usuarios_veem_extracoes_empresa" ON public.agente_extracoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agentes
      WHERE agentes.id_agente = agente_extracoes.id_agente
      AND agentes.id_empresa = public.user_empresa_id()
    )
  );

-- Guardrails
DROP POLICY IF EXISTS "usuarios_veem_guardrails_empresa" ON public.agentes_guardrails;
CREATE POLICY "usuarios_veem_guardrails_empresa" ON public.agentes_guardrails
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Treinamento inicial
DROP POLICY IF EXISTS "usuarios_veem_treinamento_empresa" ON public.agentes_treinamento_inicial;
CREATE POLICY "usuarios_veem_treinamento_empresa" ON public.agentes_treinamento_inicial
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Base de conhecimento - Domínios são vinculados ao Neurocore
DROP POLICY IF EXISTS "usuarios_veem_dominios_empresa" ON public.conhecimento_dominios;
CREATE POLICY "usuarios_veem_dominios_neurocore" ON public.conhecimento_dominios
  FOR SELECT
  USING (id_neurocore = public.user_neurocore_id());

DROP POLICY IF EXISTS "usuarios_veem_conhecimento_empresa" ON public.base_conhecimento_geral;
CREATE POLICY "usuarios_veem_conhecimento_empresa" ON public.base_conhecimento_geral
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_cobertura_empresa" ON public.conhecimento_cobertura;
CREATE POLICY "usuarios_veem_cobertura_empresa" ON public.conhecimento_cobertura
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Pessoas
DROP POLICY IF EXISTS "usuarios_veem_pessoas_empresa" ON public.pessoas;
CREATE POLICY "usuarios_veem_pessoas_empresa" ON public.pessoas
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_dados_qualificacao_empresa" ON public.pessoas_dados_qualificacao;
CREATE POLICY "usuarios_veem_dados_qualificacao_empresa" ON public.pessoas_dados_qualificacao
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Conversas
DROP POLICY IF EXISTS "usuarios_veem_conversas_empresa" ON public.conversas;
CREATE POLICY "usuarios_veem_conversas_empresa" ON public.conversas
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_interacoes_empresa" ON public.interacoes;
CREATE POLICY "usuarios_veem_interacoes_empresa" ON public.interacoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversas
      WHERE conversas.id_conversa = interacoes.id_conversa
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

DROP POLICY IF EXISTS "usuarios_veem_tags_empresa" ON public.tags;
CREATE POLICY "usuarios_veem_tags_empresa" ON public.tags
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_conversas_tags_empresa" ON public.conversas_tags;
CREATE POLICY "usuarios_veem_conversas_tags_empresa" ON public.conversas_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversas
      WHERE conversas.id_conversa = conversas_tags.id_conversa
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

DROP POLICY IF EXISTS "usuarios_veem_feedback_empresa" ON public.feedback_mensagens;
CREATE POLICY "usuarios_veem_feedback_empresa" ON public.feedback_mensagens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interacoes
      JOIN public.conversas ON conversas.id_conversa = interacoes.id_conversa
      WHERE interacoes.id_interacao = feedback_mensagens.id_interacao
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

-- Vendas
DROP POLICY IF EXISTS "usuarios_veem_vendas_empresa" ON public.vendas_contratos;
CREATE POLICY "usuarios_veem_vendas_empresa" ON public.vendas_contratos
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Financeiro
DROP POLICY IF EXISTS "usuarios_veem_carteira_empresa" ON public.carteiras;
CREATE POLICY "usuarios_veem_carteira_empresa" ON public.carteiras
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_movimentacoes_empresa" ON public.carteiras_movimentacoes;
CREATE POLICY "usuarios_veem_movimentacoes_empresa" ON public.carteiras_movimentacoes
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_usos_ia_empresa" ON public.usos_ia;
CREATE POLICY "usuarios_veem_usos_ia_empresa" ON public.usos_ia
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_notificacoes_empresa" ON public.financeiro_notificacoes;
CREATE POLICY "usuarios_veem_notificacoes_empresa" ON public.financeiro_notificacoes
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Integrações
DROP POLICY IF EXISTS "usuarios_veem_integracoes_empresa" ON public.empresa_integracoes;
CREATE POLICY "usuarios_veem_integracoes_empresa" ON public.empresa_integracoes
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_gatilhos_empresa" ON public.tags_gatilhos;
CREATE POLICY "usuarios_veem_gatilhos_empresa" ON public.tags_gatilhos
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_config_upchat_empresa" ON public.configuracoes_upchat;
CREATE POLICY "usuarios_veem_config_upchat_empresa" ON public.configuracoes_upchat
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_preferencias_ia_empresa" ON public.empresa_preferencias_ia;
CREATE POLICY "usuarios_veem_preferencias_ia_empresa" ON public.empresa_preferencias_ia
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_regras_reativacao_empresa" ON public.regras_reativacao;
CREATE POLICY "usuarios_veem_regras_reativacao_empresa" ON public.regras_reativacao
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- Experimentos
DROP POLICY IF EXISTS "usuarios_veem_experimentos_empresa" ON public.experimentos_ab;
CREATE POLICY "usuarios_veem_experimentos_empresa" ON public.experimentos_ab
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_veem_historico_experimentos_empresa" ON public.historico_experimentos_ab;
CREATE POLICY "usuarios_veem_historico_experimentos_empresa" ON public.historico_experimentos_ab
  FOR SELECT
  USING (id_empresa = public.user_empresa_id());

-- ============================================================================
-- PARTE 4: POLÍTICAS DE INSERT (Criação)
-- ============================================================================

-- Agentes
DROP POLICY IF EXISTS "usuarios_criam_agentes_empresa" ON public.agentes;
CREATE POLICY "usuarios_criam_agentes_empresa" ON public.agentes
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Extrações
DROP POLICY IF EXISTS "usuarios_criam_extracoes_empresa" ON public.agente_extracoes;
CREATE POLICY "usuarios_criam_extracoes_empresa" ON public.agente_extracoes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agentes
      WHERE agentes.id_agente = agente_extracoes.id_agente
      AND agentes.id_empresa = public.user_empresa_id()
    )
  );

-- Guardrails
DROP POLICY IF EXISTS "usuarios_criam_guardrails_empresa" ON public.agentes_guardrails;
CREATE POLICY "usuarios_criam_guardrails_empresa" ON public.agentes_guardrails
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Treinamento
DROP POLICY IF EXISTS "usuarios_criam_treinamento_empresa" ON public.agentes_treinamento_inicial;
CREATE POLICY "usuarios_criam_treinamento_empresa" ON public.agentes_treinamento_inicial
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Base de conhecimento - Domínios são vinculados ao Neurocore
DROP POLICY IF EXISTS "usuarios_criam_dominios_empresa" ON public.conhecimento_dominios;
CREATE POLICY "usuarios_criam_dominios_neurocore" ON public.conhecimento_dominios
  FOR INSERT
  WITH CHECK (id_neurocore = public.user_neurocore_id());

DROP POLICY IF EXISTS "usuarios_criam_conhecimento_empresa" ON public.base_conhecimento_geral;
CREATE POLICY "usuarios_criam_conhecimento_empresa" ON public.base_conhecimento_geral
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_criam_cobertura_empresa" ON public.conhecimento_cobertura;
CREATE POLICY "usuarios_criam_cobertura_empresa" ON public.conhecimento_cobertura
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Pessoas
DROP POLICY IF EXISTS "usuarios_criam_pessoas_empresa" ON public.pessoas;
CREATE POLICY "usuarios_criam_pessoas_empresa" ON public.pessoas
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_criam_dados_qualificacao_empresa" ON public.pessoas_dados_qualificacao;
CREATE POLICY "usuarios_criam_dados_qualificacao_empresa" ON public.pessoas_dados_qualificacao
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Tags
DROP POLICY IF EXISTS "usuarios_criam_tags_empresa" ON public.tags;
CREATE POLICY "usuarios_criam_tags_empresa" ON public.tags
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Integrações
DROP POLICY IF EXISTS "usuarios_criam_integracoes_empresa" ON public.empresa_integracoes;
CREATE POLICY "usuarios_criam_integracoes_empresa" ON public.empresa_integracoes
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_criam_gatilhos_empresa" ON public.tags_gatilhos;
CREATE POLICY "usuarios_criam_gatilhos_empresa" ON public.tags_gatilhos
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_criam_config_upchat_empresa" ON public.configuracoes_upchat;
CREATE POLICY "usuarios_criam_config_upchat_empresa" ON public.configuracoes_upchat
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_criam_preferencias_ia_empresa" ON public.empresa_preferencias_ia;
CREATE POLICY "usuarios_criam_preferencias_ia_empresa" ON public.empresa_preferencias_ia
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_criam_regras_reativacao_empresa" ON public.regras_reativacao;
CREATE POLICY "usuarios_criam_regras_reativacao_empresa" ON public.regras_reativacao
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Experimentos
DROP POLICY IF EXISTS "usuarios_criam_experimentos_empresa" ON public.experimentos_ab;
CREATE POLICY "usuarios_criam_experimentos_empresa" ON public.experimentos_ab
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Conversas (v0.7.1)
DROP POLICY IF EXISTS "usuarios_criam_conversas_empresa" ON public.conversas;
CREATE POLICY "usuarios_criam_conversas_empresa" ON public.conversas
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Interacoes (v0.7.1)
DROP POLICY IF EXISTS "usuarios_criam_interacoes_empresa" ON public.interacoes;
CREATE POLICY "usuarios_criam_interacoes_empresa" ON public.interacoes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversas
      WHERE conversas.id_conversa = interacoes.id_conversa
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

-- Conversas Tags (v0.7.1)
DROP POLICY IF EXISTS "usuarios_criam_conversas_tags_empresa" ON public.conversas_tags;
CREATE POLICY "usuarios_criam_conversas_tags_empresa" ON public.conversas_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversas
      WHERE conversas.id_conversa = conversas_tags.id_conversa
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

-- Vendas (v0.7.1)
DROP POLICY IF EXISTS "usuarios_criam_vendas_empresa" ON public.vendas_contratos;
CREATE POLICY "usuarios_criam_vendas_empresa" ON public.vendas_contratos
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Movimentações (v0.7.1)
DROP POLICY IF EXISTS "usuarios_criam_movimentacoes_empresa" ON public.carteiras_movimentacoes;
CREATE POLICY "usuarios_criam_movimentacoes_empresa" ON public.carteiras_movimentacoes
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Feedback (v0.7.1)
DROP POLICY IF EXISTS "usuarios_criam_feedback_empresa" ON public.feedback_mensagens;
CREATE POLICY "usuarios_criam_feedback_empresa" ON public.feedback_mensagens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interacoes
      JOIN public.conversas ON conversas.id_conversa = interacoes.id_conversa
      WHERE interacoes.id_interacao = feedback_mensagens.id_interacao
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

-- Usos IA (v0.7.1)
DROP POLICY IF EXISTS "usuarios_criam_usos_ia_empresa" ON public.usos_ia;
CREATE POLICY "usuarios_criam_usos_ia_empresa" ON public.usos_ia
  FOR INSERT
  WITH CHECK (id_empresa = public.user_empresa_id());

-- ============================================================================
-- PARTE 5: POLÍTICAS DE UPDATE (Atualização)
-- ============================================================================

-- Empresa
DROP POLICY IF EXISTS "usuarios_atualizam_propria_empresa" ON public.empresa;
CREATE POLICY "usuarios_atualizam_propria_empresa" ON public.empresa
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Usuários
DROP POLICY IF EXISTS "usuarios_atualizam_proprio_perfil" ON public.usuarios_sofhia;
CREATE POLICY "usuarios_atualizam_proprio_perfil" ON public.usuarios_sofhia
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Agentes
DROP POLICY IF EXISTS "usuarios_atualizam_agentes_empresa" ON public.agentes;
CREATE POLICY "usuarios_atualizam_agentes_empresa" ON public.agentes
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Treinamento
DROP POLICY IF EXISTS "usuarios_atualizam_treinamento_empresa" ON public.agentes_treinamento_inicial;
CREATE POLICY "usuarios_atualizam_treinamento_empresa" ON public.agentes_treinamento_inicial
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Base de conhecimento
DROP POLICY IF EXISTS "usuarios_atualizam_conhecimento_empresa" ON public.base_conhecimento_geral;
CREATE POLICY "usuarios_atualizam_conhecimento_empresa" ON public.base_conhecimento_geral
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Pessoas
DROP POLICY IF EXISTS "usuarios_atualizam_pessoas_empresa" ON public.pessoas;
CREATE POLICY "usuarios_atualizam_pessoas_empresa" ON public.pessoas
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Tags
DROP POLICY IF EXISTS "usuarios_atualizam_tags_empresa" ON public.tags;
CREATE POLICY "usuarios_atualizam_tags_empresa" ON public.tags
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Vendas
DROP POLICY IF EXISTS "usuarios_atualizam_vendas_empresa" ON public.vendas_contratos;
CREATE POLICY "usuarios_atualizam_vendas_empresa" ON public.vendas_contratos
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Configurações
DROP POLICY IF EXISTS "usuarios_atualizam_config_upchat_empresa" ON public.configuracoes_upchat;
CREATE POLICY "usuarios_atualizam_config_upchat_empresa" ON public.configuracoes_upchat
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_atualizam_preferencias_ia_empresa" ON public.empresa_preferencias_ia;
CREATE POLICY "usuarios_atualizam_preferencias_ia_empresa" ON public.empresa_preferencias_ia
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Conversas (v0.7.1)
DROP POLICY IF EXISTS "usuarios_atualizam_conversas_empresa" ON public.conversas;
CREATE POLICY "usuarios_atualizam_conversas_empresa" ON public.conversas
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Interacoes (v0.7.1)
DROP POLICY IF EXISTS "usuarios_atualizam_interacoes_empresa" ON public.interacoes;
CREATE POLICY "usuarios_atualizam_interacoes_empresa" ON public.interacoes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversas
      WHERE conversas.id_conversa = interacoes.id_conversa
      AND conversas.id_empresa = public.user_empresa_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversas
      WHERE conversas.id_conversa = interacoes.id_conversa
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

-- Dados Qualificação (v0.7.1)
DROP POLICY IF EXISTS "usuarios_atualizam_dados_qualificacao_empresa" ON public.pessoas_dados_qualificacao;
CREATE POLICY "usuarios_atualizam_dados_qualificacao_empresa" ON public.pessoas_dados_qualificacao
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- Feedback (v0.7.1)
DROP POLICY IF EXISTS "usuarios_atualizam_feedback_empresa" ON public.feedback_mensagens;
CREATE POLICY "usuarios_atualizam_feedback_empresa" ON public.feedback_mensagens
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interacoes
      JOIN public.conversas ON conversas.id_conversa = interacoes.id_conversa
      WHERE interacoes.id_interacao = feedback_mensagens.id_interacao
      AND conversas.id_empresa = public.user_empresa_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interacoes
      JOIN public.conversas ON conversas.id_conversa = interacoes.id_conversa
      WHERE interacoes.id_interacao = feedback_mensagens.id_interacao
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

-- Movimentações (v0.7.1)
DROP POLICY IF EXISTS "usuarios_atualizam_movimentacoes_empresa" ON public.carteiras_movimentacoes;
CREATE POLICY "usuarios_atualizam_movimentacoes_empresa" ON public.carteiras_movimentacoes
  FOR UPDATE
  USING (id_empresa = public.user_empresa_id())
  WITH CHECK (id_empresa = public.user_empresa_id());

-- ============================================================================
-- PARTE 6: POLÍTICAS DE DELETE (Exclusão)
-- ============================================================================

-- Agentes
DROP POLICY IF EXISTS "usuarios_deletam_agentes_empresa" ON public.agentes;
CREATE POLICY "usuarios_deletam_agentes_empresa" ON public.agentes
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

-- Extrações
DROP POLICY IF EXISTS "usuarios_deletam_extracoes_empresa" ON public.agente_extracoes;
CREATE POLICY "usuarios_deletam_extracoes_empresa" ON public.agente_extracoes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agentes
      WHERE agentes.id_agente = agente_extracoes.id_agente
      AND agentes.id_empresa = public.user_empresa_id()
    )
  );

-- Base de conhecimento - Domínios são vinculados ao Neurocore
DROP POLICY IF EXISTS "usuarios_deletam_dominios_empresa" ON public.conhecimento_dominios;
CREATE POLICY "usuarios_deletam_dominios_neurocore" ON public.conhecimento_dominios
  FOR DELETE
  USING (id_neurocore = public.user_neurocore_id());

DROP POLICY IF EXISTS "usuarios_deletam_conhecimento_empresa" ON public.base_conhecimento_geral;
CREATE POLICY "usuarios_deletam_conhecimento_empresa" ON public.base_conhecimento_geral
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_deletam_cobertura_empresa" ON public.conhecimento_cobertura;
CREATE POLICY "usuarios_deletam_cobertura_empresa" ON public.conhecimento_cobertura
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

-- Interacoes (v0.7.1)
DROP POLICY IF EXISTS "usuarios_deletam_interacoes_empresa" ON public.interacoes;
CREATE POLICY "usuarios_deletam_interacoes_empresa" ON public.interacoes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversas
      WHERE conversas.id_conversa = interacoes.id_conversa
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

-- Dados Qualificação (v0.7.1)
DROP POLICY IF EXISTS "usuarios_deletam_dados_qualificacao_empresa" ON public.pessoas_dados_qualificacao;
CREATE POLICY "usuarios_deletam_dados_qualificacao_empresa" ON public.pessoas_dados_qualificacao
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

-- Feedback (v0.7.1)
DROP POLICY IF EXISTS "usuarios_deletam_feedback_empresa" ON public.feedback_mensagens;
CREATE POLICY "usuarios_deletam_feedback_empresa" ON public.feedback_mensagens
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.interacoes
      JOIN public.conversas ON conversas.id_conversa = interacoes.id_conversa
      WHERE interacoes.id_interacao = feedback_mensagens.id_interacao
      AND conversas.id_empresa = public.user_empresa_id()
    )
  );

-- Movimentações (v0.7.1)
DROP POLICY IF EXISTS "usuarios_deletam_movimentacoes_empresa" ON public.carteiras_movimentacoes;
CREATE POLICY "usuarios_deletam_movimentacoes_empresa" ON public.carteiras_movimentacoes
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

-- Tags
DROP POLICY IF EXISTS "usuarios_deletam_tags_empresa" ON public.tags;
CREATE POLICY "usuarios_deletam_tags_empresa" ON public.tags
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

-- Integrações
DROP POLICY IF EXISTS "usuarios_deletam_integracoes_empresa" ON public.empresa_integracoes;
CREATE POLICY "usuarios_deletam_integracoes_empresa" ON public.empresa_integracoes
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_deletam_gatilhos_empresa" ON public.tags_gatilhos;
CREATE POLICY "usuarios_deletam_gatilhos_empresa" ON public.tags_gatilhos
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

DROP POLICY IF EXISTS "usuarios_deletam_regras_reativacao_empresa" ON public.regras_reativacao;
CREATE POLICY "usuarios_deletam_regras_reativacao_empresa" ON public.regras_reativacao
  FOR DELETE
  USING (id_empresa = public.user_empresa_id());

-- ============================================================================
-- PARTE 7: TABELAS PÚBLICAS (SEM RLS)
-- ============================================================================
-- As seguintes tabelas NÃO precisam de RLS pois são dados globais:
-- - neurocores (sistema)
-- - agentes_tipos (sistema)
-- - ia_modelos (catálogo global)
-- - integracoes_catalogo (catálogo global)
-- - planos (catálogo de planos)

-- ============================================================================
-- FIM DAS POLÍTICAS RLS
-- ============================================================================

-- Verificar políticas criadas:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
