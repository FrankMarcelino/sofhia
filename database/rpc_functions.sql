-- ============================================================================
-- SOFHIA Enterprise - RPC Functions (Funções Auxiliares)
-- ============================================================================
-- 
-- Este script cria funções auxiliares para consultas otimizadas e cálculos.
--
-- IMPORTANTE: Execute APÓS schema.sql e rls_policies.sql
--
-- ============================================================================

-- ============================================================================
-- PARTE 1: FUNÇÕES DE EMPRESA E USUÁRIO
-- ============================================================================

-- Buscar dados completos da empresa por company_name (UpChat)
DROP FUNCTION IF EXISTS public.buscar_dados_empresa_por_company_name(text);
CREATE OR REPLACE FUNCTION public.buscar_dados_empresa_por_company_name(
  p_company_name text
)
RETURNS TABLE (
  id_empresa uuid,
  nome text,
  cnpj text,
  cidade text,
  telefone text,
  email text,
  site text,
  instagram text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    e.id_empresa,
    e.nome,
    e.cnpj,
    e.cidade,
    e.telefone,
    e.email,
    e.site,
    e.instagram
  FROM public.empresa e
  JOIN public.configuracoes_upchat cu ON cu.id_empresa = e.id_empresa
  WHERE cu.company_name = p_company_name
  AND e.status_empresa = 'ATIVO'
  LIMIT 1;
$$;

-- ============================================================================
-- PARTE 2: FUNÇÕES DE DASHBOARD E KPIs
-- ============================================================================

-- Calcular KPIs do Dashboard
DROP FUNCTION IF EXISTS public.calcular_kpis_dashboard(uuid, timestamp with time zone, timestamp with time zone);
CREATE OR REPLACE FUNCTION public.calcular_kpis_dashboard(
  p_id_empresa uuid,
  p_data_inicio timestamp with time zone DEFAULT NULL,
  p_data_fim timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_vendas_hoje numeric;
  v_conversas_ativas integer;
  v_leads_gerados integer;
  v_taxa_conversao numeric;
  v_data_inicio timestamp with time zone;
  v_data_fim timestamp with time zone;
BEGIN
  -- Definir intervalo de datas (padrão: hoje)
  v_data_inicio := COALESCE(p_data_inicio, CURRENT_DATE::timestamp with time zone);
  v_data_fim := COALESCE(p_data_fim, (CURRENT_DATE + interval '1 day')::timestamp with time zone);

  -- Vendas hoje
  SELECT COALESCE(SUM(valor_mensal), 0)
  INTO v_vendas_hoje
  FROM public.vendas_contratos
  WHERE id_empresa = p_id_empresa
  AND created_at >= v_data_inicio
  AND created_at < v_data_fim;

  -- Conversas ativas
  SELECT COUNT(*)
  INTO v_conversas_ativas
  FROM public.conversas
  WHERE id_empresa = p_id_empresa
  AND status_conversa = 'conversando'
  AND encerrada = false;

  -- Leads gerados (pessoas criadas hoje)
  SELECT COUNT(*)
  INTO v_leads_gerados
  FROM public.pessoas
  WHERE id_empresa = p_id_empresa
  AND created_at >= v_data_inicio
  AND created_at < v_data_fim;

  -- Taxa de conversão (vendas / leads)
  IF v_leads_gerados > 0 THEN
    SELECT COUNT(*)::numeric / v_leads_gerados * 100
    INTO v_taxa_conversao
    FROM public.vendas_contratos
    WHERE id_empresa = p_id_empresa
    AND created_at >= v_data_inicio
    AND created_at < v_data_fim;
  ELSE
    v_taxa_conversao := 0;
  END IF;

  -- Retornar JSON
  RETURN json_build_object(
    'vendas_hoje', v_vendas_hoje,
    'conversas_ativas', v_conversas_ativas,
    'leads_gerados', v_leads_gerados,
    'taxa_conversao', ROUND(v_taxa_conversao, 2)
  );
END;
$$;

-- Buscar tendência de vendas (últimos N dias)
DROP FUNCTION IF EXISTS public.buscar_tendencia_vendas(uuid, integer);
CREATE OR REPLACE FUNCTION public.buscar_tendencia_vendas(
  p_id_empresa uuid,
  p_dias integer DEFAULT 30
)
RETURNS TABLE (
  data date,
  valor_total numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    created_at::date as data,
    SUM(valor_mensal) as valor_total
  FROM public.vendas_contratos
  WHERE id_empresa = p_id_empresa
  AND created_at >= CURRENT_DATE - (p_dias || ' days')::interval
  GROUP BY created_at::date
  ORDER BY data DESC;
$$;

-- Buscar funil de vendas (conversão por etapa)
DROP FUNCTION IF EXISTS public.buscar_funil_vendas(uuid, timestamp with time zone, timestamp with time zone);
CREATE OR REPLACE FUNCTION public.buscar_funil_vendas(
  p_id_empresa uuid,
  p_data_inicio timestamp with time zone DEFAULT NULL,
  p_data_fim timestamp with time zone DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_total_conversas integer;
  v_total_leads integer;
  v_total_negociacao integer;
  v_total_vendas integer;
  v_data_inicio timestamp with time zone;
  v_data_fim timestamp with time zone;
BEGIN
  v_data_inicio := COALESCE(p_data_inicio, CURRENT_DATE - interval '30 days');
  v_data_fim := COALESCE(p_data_fim, CURRENT_DATE + interval '1 day');

  -- Total de conversas iniciadas
  SELECT COUNT(*)
  INTO v_total_conversas
  FROM public.conversas
  WHERE id_empresa = p_id_empresa
  AND created_at >= v_data_inicio
  AND created_at < v_data_fim;

  -- Total com tag "lead"
  SELECT COUNT(DISTINCT ct.id_conversa)
  INTO v_total_leads
  FROM public.conversas_tags ct
  JOIN public.tags t ON t.id_tag = ct.id_tag
  JOIN public.conversas c ON c.id_conversa = ct.id_conversa
  WHERE c.id_empresa = p_id_empresa
  AND LOWER(t.nome) LIKE '%lead%'
  AND ct.created_at >= v_data_inicio
  AND ct.created_at < v_data_fim;

  -- Total com tag "negociacao"
  SELECT COUNT(DISTINCT ct.id_conversa)
  INTO v_total_negociacao
  FROM public.conversas_tags ct
  JOIN public.tags t ON t.id_tag = ct.id_tag
  JOIN public.conversas c ON c.id_conversa = ct.id_conversa
  WHERE c.id_empresa = p_id_empresa
  AND LOWER(t.nome) LIKE '%negoci%'
  AND ct.created_at >= v_data_inicio
  AND ct.created_at < v_data_fim;

  -- Total de vendas
  SELECT COUNT(*)
  INTO v_total_vendas
  FROM public.vendas_contratos
  WHERE id_empresa = p_id_empresa
  AND created_at >= v_data_inicio
  AND created_at < v_data_fim;

  RETURN json_build_object(
    'inicio', v_total_conversas,
    'lead', v_total_leads,
    'negociacao', v_total_negociacao,
    'venda', v_total_vendas
  );
END;
$$;

-- ============================================================================
-- PARTE 3: FUNÇÕES DE CONVERSAS E ATENDIMENTO
-- ============================================================================

-- Buscar conversas com filtros (paginação)
DROP FUNCTION IF EXISTS public.buscar_conversas_com_filtros(uuid, text, text, integer, integer);
CREATE OR REPLACE FUNCTION public.buscar_conversas_com_filtros(
  p_id_empresa uuid,
  p_status_conversa text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id_conversa uuid,
  id_pessoa uuid,
  pessoa_nome text,
  pessoa_telefone text,
  status_conversa text,
  motivo_da_conversa text,
  data_ultima_interacao timestamp with time zone,
  total_mensagens bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    c.id_conversa,
    c.id_pessoa,
    p.nome as pessoa_nome,
    p.telefone as pessoa_telefone,
    c.status_conversa::text,
    c.motivo_da_conversa::text,
    c.data_ultima_interacao,
    COUNT(i.id_interacao) as total_mensagens
  FROM public.conversas c
  LEFT JOIN public.pessoas p ON p.id_pessoa = c.id_pessoa
  LEFT JOIN public.interacoes i ON i.id_conversa = c.id_conversa
  WHERE c.id_empresa = p_id_empresa
  AND (p_status_conversa IS NULL OR c.status_conversa::text = p_status_conversa)
  AND (
    p_search IS NULL 
    OR p.nome ILIKE '%' || p_search || '%'
    OR p.telefone ILIKE '%' || p_search || '%'
  )
  GROUP BY c.id_conversa, c.id_pessoa, p.nome, p.telefone, 
           c.status_conversa, c.motivo_da_conversa, c.data_ultima_interacao
  ORDER BY c.data_ultima_interacao DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================================================
-- PARTE 4: FUNÇÕES FINANCEIRAS
-- ============================================================================

-- Calcular consumo diário de IA (últimos N dias)
DROP FUNCTION IF EXISTS public.buscar_consumo_ia_diario(uuid, integer);
CREATE OR REPLACE FUNCTION public.buscar_consumo_ia_diario(
  p_id_empresa uuid,
  p_dias integer DEFAULT 30
)
RETURNS TABLE (
  data date,
  total_tokens bigint,
  custo_total_usd numeric,
  total_usos bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    created_at::date as data,
    SUM(tokens_total) as total_tokens,
    SUM(custo_total_usd) as custo_total_usd,
    COUNT(*) as total_usos
  FROM public.usos_ia
  WHERE id_empresa = p_id_empresa
  AND created_at >= CURRENT_DATE - (p_dias || ' days')::interval
  GROUP BY created_at::date
  ORDER BY data DESC;
$$;

-- Calcular consumo por fornecedor (OpenAI, ElevenLabs, etc.)
DROP FUNCTION IF EXISTS public.buscar_consumo_por_fornecedor(uuid, timestamp with time zone, timestamp with time zone);
CREATE OR REPLACE FUNCTION public.buscar_consumo_por_fornecedor(
  p_id_empresa uuid,
  p_data_inicio timestamp with time zone DEFAULT NULL,
  p_data_fim timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
  provedor text,
  total_tokens bigint,
  custo_total_usd numeric,
  total_usos bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    m.provedor,
    SUM(u.tokens_total) as total_tokens,
    SUM(u.custo_total_usd) as custo_total_usd,
    COUNT(*) as total_usos
  FROM public.usos_ia u
  JOIN public.ia_modelos m ON m.id_modelo = u.id_modelo
  WHERE u.id_empresa = p_id_empresa
  AND (p_data_inicio IS NULL OR u.created_at >= p_data_inicio)
  AND (p_data_fim IS NULL OR u.created_at < p_data_fim)
  GROUP BY m.provedor
  ORDER BY custo_total_usd DESC;
$$;

-- ============================================================================
-- PARTE 5: FUNÇÕES DE PESSOAS (CRM)
-- ============================================================================

-- Buscar pessoas com dados de qualificação
DROP FUNCTION IF EXISTS public.buscar_pessoa_completa(uuid);
CREATE OR REPLACE FUNCTION public.buscar_pessoa_completa(
  p_id_pessoa uuid
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_pessoa json;
  v_dados_qualificacao json;
BEGIN
  -- Buscar dados da pessoa
  SELECT row_to_json(p.*)
  INTO v_pessoa
  FROM public.pessoas p
  WHERE p.id_pessoa = p_id_pessoa;

  -- Buscar dados de qualificação
  SELECT json_agg(
    json_build_object(
      'chave', dq.chave,
      'valor', dq.valor,
      'confianca_ia', dq.confianca_ia,
      'origem_dado', dq.origem_dado,
      'created_at', dq.created_at
    )
  )
  INTO v_dados_qualificacao
  FROM public.pessoas_dados_qualificacao dq
  WHERE dq.id_pessoa = p_id_pessoa;

  -- Retornar JSON combinado
  RETURN json_build_object(
    'pessoa', v_pessoa,
    'dados_qualificacao', COALESCE(v_dados_qualificacao, '[]'::json)
  );
END;
$$;

-- ============================================================================
-- PARTE 6: FUNÇÕES DE BUSCA SEMÂNTICA (RAG)
-- ============================================================================

-- Buscar documentos similares (quando vetores estiverem implementados)
-- Nota: Requer extensão pgvector instalada
-- CREATE EXTENSION IF NOT EXISTS vector;

DROP FUNCTION IF EXISTS public.buscar_conhecimento_similar(uuid, vector, integer);
CREATE OR REPLACE FUNCTION public.buscar_conhecimento_similar(
  p_id_empresa uuid,
  p_query_embedding vector,
  p_limite integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  titulo text,
  conteudo text,
  distancia real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    bc.id,
    bc.titulo,
    bc.conteudo,
    (bc.embedding <=> p_query_embedding)::real as distancia
  FROM public.base_conhecimento_geral bc
  WHERE bc.id_empresa = p_id_empresa
  AND bc.embedding IS NOT NULL
  ORDER BY bc.embedding <=> p_query_embedding
  LIMIT p_limite;
$$;

-- ============================================================================
-- PARTE 7: FUNÇÕES DE HEATMAP
-- ============================================================================

-- Buscar heatmap de interações (dia da semana x hora do dia)
DROP FUNCTION IF EXISTS public.buscar_heatmap_interacoes(uuid, integer);
CREATE OR REPLACE FUNCTION public.buscar_heatmap_interacoes(
  p_id_empresa uuid,
  p_dias integer DEFAULT 30
)
RETURNS TABLE (
  dia_semana integer,
  hora integer,
  total_interacoes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    EXTRACT(DOW FROM i.created_at)::integer as dia_semana,
    EXTRACT(HOUR FROM i.created_at)::integer as hora,
    COUNT(*) as total_interacoes
  FROM public.interacoes i
  JOIN public.conversas c ON c.id_conversa = i.id_conversa
  WHERE c.id_empresa = p_id_empresa
  AND i.created_at >= CURRENT_DATE - (p_dias || ' days')::interval
  GROUP BY dia_semana, hora
  ORDER BY dia_semana, hora;
$$;

-- ============================================================================
-- PARTE 8: FUNÇÕES DE NOTIFICAÇÕES
-- ============================================================================

-- Verificar e criar alerta de saldo baixo
DROP FUNCTION IF EXISTS public.verificar_saldo_baixo(uuid);
CREATE OR REPLACE FUNCTION public.verificar_saldo_baixo(
  p_id_empresa uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo numeric;
  v_alerta_saldo_baixo numeric;
  v_ja_existe boolean;
BEGIN
  -- Buscar saldo e limite de alerta
  SELECT saldo_creditos, alerta_saldo_baixo
  INTO v_saldo, v_alerta_saldo_baixo
  FROM public.carteiras
  WHERE id_empresa = p_id_empresa;

  -- Verificar se saldo está baixo
  IF v_saldo <= v_alerta_saldo_baixo THEN
    -- Verificar se já existe notificação pendente
    SELECT EXISTS(
      SELECT 1 FROM public.financeiro_notificacoes
      WHERE id_empresa = p_id_empresa
      AND tipo_alerta = 'SALDO_BAIXO'
      AND status = 'PENDENTE'
    ) INTO v_ja_existe;

    -- Criar notificação se não existir
    IF NOT v_ja_existe THEN
      INSERT INTO public.financeiro_notificacoes (
        id_empresa,
        tipo_alerta,
        titulo,
        mensagem,
        status
      ) VALUES (
        p_id_empresa,
        'SALDO_BAIXO',
        'Saldo de créditos baixo',
        'Seu saldo está em R$ ' || v_saldo || '. Recarregue para evitar interrupções.',
        'PENDENTE'
      );
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- ============================================================================
-- PARTE 9: FUNÇÕES ADICIONAIS PARA DASHBOARD
-- ============================================================================

-- Calcular taxa de conversão para um período específico
DROP FUNCTION IF EXISTS public.calcular_taxa_conversao_periodo(uuid, integer);
CREATE OR REPLACE FUNCTION public.calcular_taxa_conversao_periodo(
  p_empresa_id uuid, 
  p_dias integer
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_total_leads integer;
  v_total_vendas integer;
  v_taxa numeric;
BEGIN
  -- Conta leads (pessoas) criados nos últimos N dias
  SELECT COUNT(*)
  INTO v_total_leads
  FROM public.pessoas
  WHERE id_empresa = p_empresa_id
  AND created_at >= CURRENT_DATE - (p_dias || ' days')::interval;
  
  -- Conta vendas nos últimos N dias
  SELECT COUNT(*)
  INTO v_total_vendas
  FROM public.vendas_contratos
  WHERE id_empresa = p_empresa_id
  AND created_at >= CURRENT_DATE - (p_dias || ' days')::interval;
  
  -- Calcula taxa de conversão
  IF v_total_leads > 0 THEN
    v_taxa := (v_total_vendas::numeric / v_total_leads * 100);
  ELSE
    v_taxa := 0;
  END IF;
  
  RETURN ROUND(v_taxa, 2);
END;
$$;

-- Analisar funil de vendas com dados agregados
DROP FUNCTION IF EXISTS public.analisar_funil_vendas(uuid, integer);
CREATE OR REPLACE FUNCTION public.analisar_funil_vendas(
  p_empresa_id uuid,
  p_dias integer
)
RETURNS TABLE (
  etapa text,
  quantidade bigint,
  percentual numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_total_inicio bigint;
  v_total_leads bigint;
  v_total_contato bigint;
  v_total_negociacao bigint;
  v_total_fechamento bigint;
BEGIN
  -- Total de conversas iniciadas (etapa inicial)
  SELECT COUNT(*)
  INTO v_total_inicio
  FROM public.conversas
  WHERE id_empresa = p_empresa_id
  AND created_at >= CURRENT_DATE - (p_dias || ' days')::interval;

  -- Total com tag "lead"
  SELECT COUNT(DISTINCT ct.id_conversa)
  INTO v_total_leads
  FROM public.conversas_tags ct
  JOIN public.tags t ON t.id_tag = ct.id_tag
  JOIN public.conversas c ON c.id_conversa = ct.id_conversa
  WHERE c.id_empresa = p_empresa_id
  AND LOWER(t.nome) LIKE '%lead%'
  AND ct.created_at >= CURRENT_DATE - (p_dias || ' days')::interval;

  -- Total com tag "contato" ou "proposta"
  SELECT COUNT(DISTINCT ct.id_conversa)
  INTO v_total_contato
  FROM public.conversas_tags ct
  JOIN public.tags t ON t.id_tag = ct.id_tag
  JOIN public.conversas c ON c.id_conversa = ct.id_conversa
  WHERE c.id_empresa = p_empresa_id
  AND (LOWER(t.nome) LIKE '%contato%' OR LOWER(t.nome) LIKE '%proposta%')
  AND ct.created_at >= CURRENT_DATE - (p_dias || ' days')::interval;

  -- Total com tag "negociacao"
  SELECT COUNT(DISTINCT ct.id_conversa)
  INTO v_total_negociacao
  FROM public.conversas_tags ct
  JOIN public.tags t ON t.id_tag = ct.id_tag
  JOIN public.conversas c ON c.id_conversa = ct.id_conversa
  WHERE c.id_empresa = p_empresa_id
  AND LOWER(t.nome) LIKE '%negoci%'
  AND ct.created_at >= CURRENT_DATE - (p_dias || ' days')::interval;

  -- Total de vendas fechadas
  SELECT COUNT(*)
  INTO v_total_fechamento
  FROM public.vendas_contratos
  WHERE id_empresa = p_empresa_id
  AND created_at >= CURRENT_DATE - (p_dias || ' days')::interval;

  -- Retornar tabela com etapas e percentuais
  RETURN QUERY
  SELECT 'Leads'::text, v_total_inicio, 
         CASE WHEN v_total_inicio > 0 THEN 100.0 ELSE 0 END
  UNION ALL
  SELECT 'Contato'::text, v_total_leads,
         CASE WHEN v_total_inicio > 0 THEN ROUND((v_total_leads::numeric / v_total_inicio * 100), 2) ELSE 0 END
  UNION ALL
  SELECT 'Proposta'::text, v_total_contato,
         CASE WHEN v_total_inicio > 0 THEN ROUND((v_total_contato::numeric / v_total_inicio * 100), 2) ELSE 0 END
  UNION ALL
  SELECT 'Negociação'::text, v_total_negociacao,
         CASE WHEN v_total_inicio > 0 THEN ROUND((v_total_negociacao::numeric / v_total_inicio * 100), 2) ELSE 0 END
  UNION ALL
  SELECT 'Fechamento'::text, v_total_fechamento,
         CASE WHEN v_total_inicio > 0 THEN ROUND((v_total_fechamento::numeric / v_total_inicio * 100), 2) ELSE 0 END;
END;
$$;

-- ============================================================================
-- FIM DAS FUNÇÕES RPC
-- ============================================================================

-- Listar todas as funções criadas:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
