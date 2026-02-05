-- ============================================================================
-- SEED: Criar dados para usuário 90d04e82-6619-48fc-8aee-84e68b77edd6
-- ============================================================================
--
-- Este script cria todos os dados necessários para o usuário funcionar:
-- 1. Neurocore
-- 2. Plano
-- 3. Empresa
-- 4. Usuario Sofhia
-- 5. Agente
-- 6. Tipo de Agente
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. NEUROCORE
-- ============================================================================

INSERT INTO neurocores (
  id_neurocore,
  nome,
  descricao,
  n8n_workflow_id_mestre,
  ativo
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Neurocore ISP Telecom',
  'Neurocore para provedor de internet',
  'wf_isp_master',
  true
) ON CONFLICT (id_neurocore) DO NOTHING;

-- ============================================================================
-- 2. PLANO
-- ============================================================================

INSERT INTO planos (
  id_plano,
  nome,
  tipo,
  creditos_mensais,
  permite_acumular,
  valor_mensalidade,
  ativo
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Plano Starter',
  'MENSAL_FIXO',
  5000.00,
  false,
  199.00,
  true
) ON CONFLICT (id_plano) DO NOTHING;

-- ============================================================================
-- 3. EMPRESA
-- ============================================================================

INSERT INTO empresa (
  id_empresa,
  nome,
  cnpj,
  endereco,
  cidade,
  telefone,
  site,
  email,
  status_empresa,
  id_plano,
  id_neurocore
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Empresa Demo',
  '00.000.000/0001-00',
  'Rua Demo, 123',
  'São Paulo',
  '11999999999',
  'https://demo.com.br',
  'contato@demo.com.br',
  'ATIVO',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
) ON CONFLICT (id_empresa) DO UPDATE SET
  nome = EXCLUDED.nome,
  id_neurocore = EXCLUDED.id_neurocore;

-- ============================================================================
-- 4. USUARIO SOFHIA (vincular auth user à empresa)
-- ============================================================================

INSERT INTO usuarios_sofhia (
  id,
  id_empresa,
  nome_usuario,
  ativo
) VALUES (
  '90d04e82-6619-48fc-8aee-84e68b77edd6',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Usuário Demo',
  true
) ON CONFLICT (id) DO UPDATE SET
  id_empresa = EXCLUDED.id_empresa,
  nome_usuario = EXCLUDED.nome_usuario;

-- ============================================================================
-- 5. TIPO DE AGENTE
-- ============================================================================

INSERT INTO agentes_tipos (
  id_agentes_tipos,
  id_neurocore,
  tipo_agente,
  display
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'atendente',
  'Atendente'
) ON CONFLICT (id_agentes_tipos) DO NOTHING;

-- ============================================================================
-- 6. AGENTE
-- ============================================================================

INSERT INTO agentes (
  id_agente,
  id_empresa,
  id_neurocore,
  id_tipo_agente,
  nome_agente,
  persona,
  tom_voz,
  objetivo,
  instrucoes,
  limitacoes,
  roteiro,
  rules,
  others_instructions,
  meio_comunicacao,
  ativo,
  nome_agente_identificador,
  sexo_agente,
  id_modelo_ia
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Sofia Atendente',
  'Sou uma assistente virtual amigável e profissional, especializada em atendimento ao cliente.',
  'Amigável, profissional e empático',
  'Atender clientes, responder dúvidas e encaminhar solicitações.',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'whatsapp',
  true,
  'Sofia',
  'feminino',
  'gpt-4o'
) ON CONFLICT (id_agente) DO UPDATE SET
  nome_agente = EXCLUDED.nome_agente,
  persona = EXCLUDED.persona;

-- ============================================================================
-- 7. MODELO DE IA (se não existir)
-- ============================================================================

INSERT INTO ia_modelos (
  id_modelo,
  nome_exibicao,
  provedor,
  custo_input_por_1m,
  custo_output_por_1m,
  context_window,
  ativo
) VALUES
  ('gpt-4o', 'GPT-4o', 'OpenAI', 2.50, 10.00, 128000, true),
  ('gpt-4o-mini', 'GPT-4o Mini', 'OpenAI', 0.15, 0.60, 128000, true),
  ('gpt-4-turbo', 'GPT-4 Turbo', 'OpenAI', 10.00, 30.00, 128000, true),
  ('claude-3-5-sonnet', 'Claude 3.5 Sonnet', 'Anthropic', 3.00, 15.00, 200000, true)
ON CONFLICT (id_modelo) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Execute para verificar:
--
-- SELECT u.id, u.nome_usuario, e.nome as empresa, e.id_neurocore
-- FROM usuarios_sofhia u
-- JOIN empresa e ON e.id_empresa = u.id_empresa
-- WHERE u.id = '90d04e82-6619-48fc-8aee-84e68b77edd6';
--
-- SELECT * FROM agentes WHERE id_empresa = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
-- ============================================================================
