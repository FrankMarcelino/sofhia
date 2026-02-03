-- ============================================================
-- SOFHIA Enterprise - Seed Data (Ambiente de Teste)
-- ============================================================
-- Este script popula o banco com dados de exemplo para testes
-- User ID: 5054f694-488e-4514-8624-f3c282a1afb8
-- COMPATÍVEL COM SCHEMA REAL (empresa, usuarios_sofhia, etc.)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. NEUROCORE (requisito para empresa)
-- ============================================================

INSERT INTO neurocores (
  id_neurocore,
  nome,
  descricao,
  n8n_workflow_id_mestre,
  ativo
) VALUES (
  'nc-default-001',
  'Neurocore ISP Telecom',
  'Neurocore configurado para provedor de internet',
  'wf_isp_telecom_master',
  true
) ON CONFLICT (id_neurocore) DO NOTHING;

-- ============================================================
-- 2. PLANO (requisito para empresa)
-- ============================================================

INSERT INTO planos (
  id_plano,
  nome,
  tipo,
  creditos_mensais,
  permite_acumular,
  valor_mensalidade,
  ativo
) VALUES (
  'plano-startup-001',
  'Plano Startup',
  'MENSAL_FIXO',
  10000.00,
  false,
  299.00,
  true
) ON CONFLICT (id_plano) DO NOTHING;

-- ============================================================
-- 3. EMPRESA
-- ============================================================

INSERT INTO empresa (
  id_empresa,
  nome,
  cnpj,
  endereco,
  cidade,
  telefone,
  site,
  instagram,
  email,
  status_empresa,
  id_plano,
  id_neurocore
) VALUES (
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  'ISP Telecom LTDA',
  '12.345.678/0001-90',
  'Rua das Empresas, 1000',
  'São Paulo',
  '11987654321',
  'https://isptelecom.com.br',
  '@isptelecom',
  'contato@isptelecom.com.br',
  'ATIVO',
  'plano-startup-001',
  'nc-default-001'
) ON CONFLICT (id_empresa) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email;

-- ============================================================
-- 4. USUÁRIO (usuarios_sofhia)
-- ============================================================

INSERT INTO usuarios_sofhia (
  id,
  id_empresa,
  nome_usuario,
  ativo
) VALUES (
  '5054f694-488e-4514-8624-f3c282a1afb8',
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  'Frank Silva',
  true
) ON CONFLICT (id) DO UPDATE SET
  id_empresa = EXCLUDED.id_empresa,
  nome_usuario = EXCLUDED.nome_usuario;

-- ============================================================
-- 5. CARTEIRA (requisito para empresa)
-- ============================================================

INSERT INTO carteiras (
  id_carteira,
  id_empresa,
  saldo_creditos,
  limite_cheque_especial,
  alerta_saldo_baixo,
  ativo
) VALUES (
  gen_random_uuid(),
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  1500.00,
  500.00,
  100.00,
  true
) ON CONFLICT (id_empresa) DO UPDATE SET
  saldo_creditos = EXCLUDED.saldo_creditos;

-- ============================================================
-- 6. CLIENTES (PESSOAS)
-- ============================================================

INSERT INTO pessoas (id_pessoa, id_empresa, nome, telefone, email, cpf, endereco, bairro, cidade, estado, cep, observacoes) VALUES
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'João Pedro Santos', '11987651234', 'joao.santos@email.com', '123.456.789-00', 'Rua A, 123', 'Centro', 'São Paulo', 'SP', '01000-000', 'Cliente premium - Fibra 500MB'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Maria Oliveira', '11987652345', 'maria.oliveira@email.com', '234.567.890-11', 'Av B, 456', 'Jardins', 'São Paulo', 'SP', '01400-000', 'Cliente - Fibra 300MB'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Carlos Eduardo Lima', '11987653456', 'carlos.lima@email.com', NULL, 'Rua C, 789', 'Vila Mariana', 'São Paulo', 'SP', '04100-000', 'Lead - Interesse em Fibra 1GB'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Ana Paula Costa', '11987654567', 'ana.costa@email.com', '345.678.901-22', NULL, NULL, 'Campinas', 'SP', NULL, 'Cliente cancelado - Mudou de cidade'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Roberto Silva', '11987655678', 'roberto.silva@email.com', '456.789.012-33', 'Rua D, 321', 'Moema', 'São Paulo', 'SP', '04500-000', 'Cliente premium - Fibra 1GB'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Patricia Ferreira', '11987656789', 'patricia.f@email.com', NULL, NULL, NULL, 'São Paulo', 'SP', NULL, 'Lead - Origem WhatsApp'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Lucas Mendes', '11987657890', 'lucas.mendes@email.com', '567.890.123-44', 'Av E, 654', 'Pinheiros', 'São Paulo', 'SP', '05400-000', 'Cliente - Fibra 200MB'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Fernanda Rocha', '11987658901', 'fernanda.rocha@email.com', '678.901.234-55', 'Rua F, 987', 'Itaim Bibi', 'São Paulo', 'SP', '04500-000', 'Cliente premium - Fibra 1GB'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Pedro Almeida', '11987659012', 'pedro.almeida@email.com', NULL, NULL, NULL, 'São Paulo', 'SP', NULL, 'Lead - Origem Instagram'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Juliana Martins', '11987650123', 'juliana.m@email.com', '789.012.345-66', 'Rua G, 135', 'Brooklin', 'São Paulo', 'SP', '04600-000', 'Cliente - Fibra 500MB');

-- ============================================================
-- 7. MODELOS IA (requisito para agentes)
-- ============================================================

INSERT INTO ia_modelos (id_modelo, nome_exibicao, provedor, custo_input_por_1m, custo_output_por_1m, context_window, ativo) VALUES
  ('gpt-4o', 'GPT-4o', 'OpenAI', 5.00, 15.00, 128000, true),
  ('gpt-4-turbo', 'GPT-4 Turbo', 'OpenAI', 10.00, 30.00, 128000, true)
ON CONFLICT (id_modelo) DO NOTHING;

-- ============================================================
-- 8. TIPOS DE AGENTES (requisito para agentes)
-- ============================================================

INSERT INTO agentes_tipos (id_agentes_tipos, id_neurocore, tipo_agente, display) VALUES
  (gen_random_uuid(), 'nc-default-001', 'atendimento', 'Atendimento'),
  (gen_random_uuid(), 'nc-default-001', 'vendas', 'Vendas'),
  (gen_random_uuid(), 'nc-default-001', 'suporte', 'Suporte Técnico')
ON CONFLICT (id_agentes_tipos) DO NOTHING;

-- ============================================================
-- 9. AGENTES IA
-- ============================================================

WITH tipo_atendimento AS (
  SELECT id_agentes_tipos FROM agentes_tipos WHERE tipo_agente = 'atendimento' LIMIT 1
),
tipo_vendas AS (
  SELECT id_agentes_tipos FROM agentes_tipos WHERE tipo_agente = 'vendas' LIMIT 1
),
tipo_suporte AS (
  SELECT id_agentes_tipos FROM agentes_tipos WHERE tipo_agente = 'suporte' LIMIT 1
)
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
  id_modelo_ia,
  ativo
)
SELECT
  gen_random_uuid(),
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  'nc-default-001',
  (SELECT id_agentes_tipos FROM tipo_atendimento),
  'Atendente Virtual ISP',
  'Você é um atendente virtual cordial e profissional da ISP Telecom',
  'Amigável, profissional e prestativo',
  'Realizar atendimento inicial e qualificar leads',
  jsonb_build_array(
    'Cumprimente o cliente pelo nome',
    'Identifique se é cliente ou lead',
    'Qualifique o interesse em planos',
    'Ofereça suporte técnico se necessário'
  ),
  'gpt-4o',
  true
UNION ALL
SELECT
  gen_random_uuid(),
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  'nc-default-001',
  (SELECT id_agentes_tipos FROM tipo_vendas),
  'Vendedor Virtual',
  'Você é um vendedor especializado em internet fibra óptica',
  'Persuasivo, confiante e consultivo',
  'Converter leads em clientes',
  jsonb_build_array(
    'Apresente planos de forma atrativa',
    'Destaque benefícios da fibra óptica',
    'Trate objeções com empatia',
    'Conduza para fechamento'
  ),
  'gpt-4o',
  true
UNION ALL
SELECT
  gen_random_uuid(),
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  'nc-default-001',
  (SELECT id_agentes_tipos FROM tipo_suporte),
  'Suporte Técnico IA',
  'Você é um técnico de suporte especializado em internet',
  'Paciente, técnico e didático',
  'Resolver problemas técnicos dos clientes',
  jsonb_build_array(
    'Diagnostique o problema',
    'Oriente soluções básicas',
    'Escale se necessário'
  ),
  'gpt-4o',
  true;

-- ============================================================
-- 10. CONVERSAS (últimos 7 dias)
-- ============================================================

WITH pessoas_sample AS (
  SELECT id_pessoa, nome FROM pessoas 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' 
  LIMIT 5
),
agente_sample AS (
  SELECT id_agente FROM agentes 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' 
  LIMIT 1
)
INSERT INTO conversas (
  id_conversa,
  id_empresa,
  id_pessoa,
  id_agente_atendente,
  status_conversa,
  motivo_da_conversa,
  encerrada,
  data_ultima_interacao,
  created_at
)
SELECT
  gen_random_uuid(),
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  p.id_pessoa,
  a.id_agente,
  CASE WHEN random() < 0.3 THEN 'conversando'::"CONVERSA_STATUS" ELSE 'encerrada'::"CONVERSA_STATUS" END,
  CASE 
    WHEN random() < 0.3 THEN 'SUPORTE'::"MOTIVO_CONVERSA"
    WHEN random() < 0.6 THEN 'VENDA'::"MOTIVO_CONVERSA"
    ELSE 'NAO_IDENTIFICADO'::"MOTIVO_CONVERSA"
  END,
  random() > 0.3,
  NOW() - (random() * interval '7 days'),
  NOW() - (random() * interval '7 days')
FROM pessoas_sample p
CROSS JOIN agente_sample a;

-- ============================================================
-- 11. INTERAÇÕES (mensagens das conversas)
-- ============================================================

WITH conversas_recentes AS (
  SELECT id_conversa, id_pessoa FROM conversas 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6'
  LIMIT 5
),
pessoas_nomes AS (
  SELECT id_pessoa, nome FROM pessoas
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6'
)
INSERT INTO interacoes (
  id_interacao,
  id_conversa,
  remetente,
  mensagem_texto,
  tipo_mensagem,
  created_at
)
SELECT
  gen_random_uuid(),
  c.id_conversa,
  'cliente',
  'Olá, preciso de ajuda com minha internet!',
  'text',
  NOW() - (random() * interval '7 days')
FROM conversas_recentes c
UNION ALL
SELECT
  gen_random_uuid(),
  c.id_conversa,
  'agente',
  'Olá! Claro, estou aqui para ajudar. Pode me contar o que está acontecendo?',
  'text',
  NOW() - (random() * interval '7 days') + interval '30 seconds'
FROM conversas_recentes c;

-- ============================================================
-- 12. USOS IA (últimos 30 dias)
-- ============================================================

WITH agentes_sample AS (
  SELECT id_agente FROM agentes 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6'
),
conversas_sample AS (
  SELECT id_conversa FROM conversas
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6'
  LIMIT 5
)
INSERT INTO usos_ia (
  id_empresa,
  id_agente,
  id_conversa,
  id_modelo,
  tokens_total,
  custo_total_usd,
  created_at
)
SELECT
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  a.id_agente,
  c.id_conversa,
  'gpt-4o',
  (random() * 1500)::integer + 500,
  ((random() * 0.05)::numeric(10,4) + 0.01),
  NOW() - (random() * interval '30 days')
FROM agentes_sample a
CROSS JOIN conversas_sample c
CROSS JOIN generate_series(1, 4) AS gs;

-- ============================================================
-- 13. BASE DE CONHECIMENTO
-- ============================================================

INSERT INTO conhecimento_dominios (
  id_dominio,
  id_empresa,
  nome,
  descricao,
  ativo
) VALUES
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Planos e Preços',
    'Informações sobre planos de internet, preços e promoções',
    true
  ),
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Suporte Técnico',
    'Procedimentos de troubleshooting e resolução de problemas',
    true
  ),
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Políticas da Empresa',
    'Termos de serviço, políticas de cancelamento e SLA',
    true
  );

-- ============================================================
-- 14. DOCUMENTOS DA BASE DE CONHECIMENTO
-- ============================================================

WITH dominios_sample AS (
  SELECT id_dominio, nome FROM conhecimento_dominios 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6'
)
INSERT INTO base_conhecimento_geral (
  id,
  id_empresa,
  id_dominio,
  titulo,
  conteudo
)
SELECT
  gen_random_uuid(),
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  d.id_dominio,
  CASE 
    WHEN d.nome = 'Planos e Preços' THEN 'Tabela de Planos 2026'
    WHEN d.nome = 'Suporte Técnico' THEN 'Como resolver problemas de conexão'
    ELSE 'Política de Cancelamento'
  END,
  CASE 
    WHEN d.nome = 'Planos e Preços' THEN 'Fibra 200MB: R$ 79,90/mês | Fibra 300MB: R$ 99,90/mês | Fibra 500MB: R$ 149,90/mês | Fibra 1GB: R$ 199,90/mês. Todos os planos incluem instalação grátis, WiFi 6, suporte 24/7 e velocidade simétrica.'
    WHEN d.nome = 'Suporte Técnico' THEN 'Passo 1: Reinicie o roteador (desligue 30s). Passo 2: Verifique todos os cabos (conectados e sem danos). Passo 3: Teste em outro dispositivo. Passo 4: Verifique as luzes do roteador (Power, WAN, WiFi devem estar acesas).'
    ELSE 'O cliente pode cancelar com 30 dias de antecedência. Não há multa após 12 meses de fidelidade. Durante a fidelidade, multa proporcional aos meses restantes (R$ 50 por mês).'
  END
FROM dominios_sample d;

COMMIT;

-- ============================================================
-- ✅ Seed completo!
-- ============================================================
-- Execute: psql -h seu-host -U postgres -d postgres -f database/seed.sql
-- Ou via Supabase SQL Editor
-- ============================================================
