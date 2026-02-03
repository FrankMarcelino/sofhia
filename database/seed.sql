-- ============================================================
-- SOFHIA Enterprise - Seed Data (Ambiente de Teste)
-- ============================================================
-- Este script popula o banco com dados de exemplo para testes
-- User ID: 5054f694-488e-4514-8624-f3c282a1afb8
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EMPRESA
-- ============================================================

INSERT INTO empresas (
  id,
  razao_social,
  nome_fantasia,
  cnpj,
  telefone,
  email,
  saldo,
  config_upchat,
  config_gateway_pagamento
) VALUES (
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  'ISP Telecom LTDA',
  'ISP Telecom',
  '12.345.678/0001-90',
  '11987654321',
  'contato@isptelecom.com.br',
  1500.00, -- Saldo inicial
  jsonb_build_object(
    'api_key', 'test_upchat_key_123',
    'webhook_url', 'https://api.upchat.com/webhook',
    'instancia_id', 'inst_12345'
  ),
  jsonb_build_object(
    'pix_key', 'pix@isptelecom.com.br',
    'boleto_config', jsonb_build_object('banco', '001', 'agencia', '1234', 'conta', '56789-0')
  )
) ON CONFLICT (id) DO UPDATE SET
  razao_social = EXCLUDED.razao_social,
  nome_fantasia = EXCLUDED.nome_fantasia,
  saldo = EXCLUDED.saldo;

-- ============================================================
-- 2. USUÁRIO
-- ============================================================

INSERT INTO usuarios (
  id,
  id_empresa,
  nome,
  email,
  papel,
  ativo
) VALUES (
  '5054f694-488e-4514-8624-f3c282a1afb8',
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  'Frank Silva',
  'frank@isptelecom.com.br',
  'admin',
  true
) ON CONFLICT (id) DO UPDATE SET
  id_empresa = EXCLUDED.id_empresa,
  nome = EXCLUDED.nome,
  email = EXCLUDED.email;

-- ============================================================
-- 3. CLIENTES (PESSOAS)
-- ============================================================

INSERT INTO pessoas (id, id_empresa, nome, telefone, email, status, tags, dados_adicionais) VALUES
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'João Pedro Santos', '11987651234', 'joao.santos@email.com', 'ativo', ARRAY['premium', 'fibra'], 
   jsonb_build_object('endereco', 'Rua A, 123', 'plano', 'Fibra 500MB', 'valor_mensalidade', 149.90)),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Maria Oliveira', '11987652345', 'maria.oliveira@email.com', 'ativo', ARRAY['fibra'], 
   jsonb_build_object('endereco', 'Av B, 456', 'plano', 'Fibra 300MB', 'valor_mensalidade', 99.90)),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Carlos Eduardo Lima', '11987653456', 'carlos.lima@email.com', 'ativo', ARRAY['lead'], 
   jsonb_build_object('endereco', 'Rua C, 789', 'interesse', 'Fibra 1GB')),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Ana Paula Costa', '11987654567', 'ana.costa@email.com', 'inativo', ARRAY['cancelado'], 
   jsonb_build_object('motivo_cancelamento', 'Mudou de cidade', 'data_cancelamento', '2026-01-15')),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Roberto Silva', '11987655678', 'roberto.silva@email.com', 'ativo', ARRAY['premium', 'fibra'], 
   jsonb_build_object('endereco', 'Rua D, 321', 'plano', 'Fibra 1GB', 'valor_mensalidade', 199.90)),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Patricia Ferreira', '11987656789', 'patricia.f@email.com', 'ativo', ARRAY['lead'], 
   jsonb_build_object('interesse', 'Fibra 500MB', 'origem', 'WhatsApp')),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Lucas Mendes', '11987657890', 'lucas.mendes@email.com', 'ativo', ARRAY['fibra'], 
   jsonb_build_object('endereco', 'Av E, 654', 'plano', 'Fibra 200MB', 'valor_mensalidade', 79.90)),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Fernanda Rocha', '11987658901', 'fernanda.rocha@email.com', 'ativo', ARRAY['premium', 'fibra'], 
   jsonb_build_object('endereco', 'Rua F, 987', 'plano', 'Fibra 1GB', 'valor_mensalidade', 199.90)),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Pedro Almeida', '11987659012', 'pedro.almeida@email.com', 'ativo', ARRAY['lead', 'whatsapp'], 
   jsonb_build_object('interesse', 'Fibra 300MB', 'origem', 'Instagram')),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'Juliana Martins', '11987650123', 'juliana.m@email.com', 'ativo', ARRAY['fibra'], 
   jsonb_build_object('endereco', 'Rua G, 135', 'plano', 'Fibra 500MB', 'valor_mensalidade', 149.90));

-- ============================================================
-- 4. AGENTES IA (NEUROCORE)
-- ============================================================

INSERT INTO agentes (
  id,
  id_empresa,
  nome,
  descricao,
  tipo,
  modelo_ia,
  instrucoes,
  temperatura,
  ativo
) VALUES
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Atendente Virtual ISP',
    'Agente responsável por atendimento inicial e qualificação de leads',
    'atendimento',
    'gpt-4-turbo',
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Saudação', 'conteudo', 'Seja cordial e profissional. Cumprimente o cliente pelo nome.', 'ativo', true, 'ordem', 1),
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Identificação', 'conteudo', 'Identifique se é cliente atual ou potencial cliente (lead).', 'ativo', true, 'ordem', 2),
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Qualificação', 'conteudo', 'Para leads: pergunte sobre localização e interesse em planos de internet.', 'ativo', true, 'ordem', 3),
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Suporte', 'conteudo', 'Para clientes: ofereça ajuda com suporte técnico, financeiro ou dúvidas gerais.', 'ativo', true, 'ordem', 4)
    ),
    0.7,
    true
  ),
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Vendedor Virtual',
    'Especialista em vendas e conversão de leads',
    'vendas',
    'gpt-4-turbo',
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Apresentação', 'conteudo', 'Apresente os planos de internet disponíveis de forma clara e atrativa.', 'ativo', true, 'ordem', 1),
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Benefícios', 'conteudo', 'Destaque: fibra óptica, velocidade estável, sem franquia, suporte 24/7.', 'ativo', true, 'ordem', 2),
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Objeções', 'conteudo', 'Trate objeções com empatia. Ofereça garantia de 7 dias e teste grátis.', 'ativo', true, 'ordem', 3),
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Fechamento', 'conteudo', 'Conduza para o fechamento oferecendo agendamento de instalação.', 'ativo', true, 'ordem', 4)
    ),
    0.8,
    true
  ),
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Suporte Técnico IA',
    'Agente especializado em suporte técnico e troubleshooting',
    'suporte',
    'gpt-4-turbo',
    jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Diagnóstico', 'conteudo', 'Faça perguntas direcionadas para identificar o problema: internet lenta, sem conexão, intermitente, etc.', 'ativo', true, 'ordem', 1),
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Soluções Básicas', 'conteudo', 'Oriente: reiniciar roteador, verificar cabos, testar velocidade, verificar luzes do equipamento.', 'ativo', true, 'ordem', 2),
      jsonb_build_object('id', gen_random_uuid()::text, 'titulo', 'Escalação', 'conteudo', 'Se não resolver, abra chamado técnico com dados: nome, endereço, descrição do problema.', 'ativo', true, 'ordem', 3)
    ),
    0.5,
    true
  );

-- ============================================================
-- 5. CONVERSAS (últimos 7 dias)
-- ============================================================

WITH pessoas_sample AS (
  SELECT id, nome FROM pessoas 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' 
  LIMIT 5
),
agente_sample AS (
  SELECT id FROM agentes 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' 
  LIMIT 1
)
INSERT INTO conversas (
  id,
  id_empresa,
  id_pessoa,
  id_agente,
  canal,
  status,
  prioridade,
  tags,
  created_at
)
SELECT
  gen_random_uuid(),
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  p.id,
  a.id,
  'whatsapp',
  CASE WHEN random() < 0.3 THEN 'ativa' ELSE 'encerrada' END,
  CASE 
    WHEN random() < 0.2 THEN 'alta'
    WHEN random() < 0.5 THEN 'media'
    ELSE 'baixa'
  END,
  ARRAY['atendimento', 'ia'],
  NOW() - (random() * interval '7 days')
FROM pessoas_sample p
CROSS JOIN agente_sample a;

-- ============================================================
-- 6. MENSAGENS (para conversas criadas)
-- ============================================================

WITH conversas_recentes AS (
  SELECT id, id_pessoa FROM conversas 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6'
  LIMIT 5
),
agente_sample AS (
  SELECT id FROM agentes 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6' 
  LIMIT 1
)
INSERT INTO mensagens (
  id,
  id_conversa,
  id_remetente,
  tipo_remetente,
  conteudo,
  created_at
)
SELECT
  gen_random_uuid(),
  c.id,
  c.id_pessoa,
  'pessoa',
  'Olá, preciso de ajuda com minha internet!',
  NOW() - (random() * interval '7 days')
FROM conversas_recentes c
UNION ALL
SELECT
  gen_random_uuid(),
  c.id,
  a.id,
  'agente',
  'Olá! Claro, estou aqui para ajudar. Pode me contar o que está acontecendo?',
  NOW() - (random() * interval '7 days') + interval '30 seconds'
FROM conversas_recentes c
CROSS JOIN agente_sample a;

-- ============================================================
-- 7. CONSUMOS IA (últimos 30 dias)
-- ============================================================

WITH agentes_sample AS (
  SELECT id FROM agentes 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6'
)
INSERT INTO consumos_ia (
  id,
  id_empresa,
  id_agente,
  modelo,
  tokens_entrada,
  tokens_saida,
  custo_usd,
  data_consumo
)
SELECT
  gen_random_uuid(),
  'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
  a.id,
  'gpt-4-turbo',
  (random() * 1000)::integer + 500,
  (random() * 500)::integer + 200,
  (random() * 0.05)::numeric(10,4) + 0.01,
  NOW() - (random() * interval '30 days')
FROM agentes_sample a
CROSS JOIN generate_series(1, 20) AS gs;

-- ============================================================
-- 8. TRANSAÇÕES FINANCEIRAS
-- ============================================================

INSERT INTO transacoes (
  id,
  id_empresa,
  tipo,
  valor,
  status,
  metodo_pagamento,
  descricao,
  created_at
) VALUES
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'credito', 1000.00, 'concluida', 'pix', 
   'Recarga inicial de créditos', NOW() - interval '25 days'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'debito', 45.80, 'concluida', 'automatico', 
   'Consumo IA - Uso do mês', NOW() - interval '20 days'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'credito', 500.00, 'concluida', 'boleto', 
   'Recarga de créditos', NOW() - interval '15 days'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'debito', 78.30, 'concluida', 'automatico', 
   'Consumo IA - Uso do mês', NOW() - interval '10 days'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'credito', 250.00, 'pendente', 'pix', 
   'Recarga de créditos', NOW() - interval '2 days'),
  
  (gen_random_uuid(), 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', 'debito', 32.50, 'concluida', 'automatico', 
   'Consumo IA - Semana atual', NOW() - interval '1 day');

-- ============================================================
-- 9. BASE DE CONHECIMENTO
-- ============================================================

INSERT INTO dominios_conhecimento (
  id,
  id_empresa,
  nome,
  descricao,
  tipo,
  ativo
) VALUES
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Planos e Preços',
    'Informações sobre planos de internet, preços e promoções',
    'faq',
    true
  ),
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Suporte Técnico',
    'Procedimentos de troubleshooting e resolução de problemas',
    'manual',
    true
  ),
  (
    gen_random_uuid(),
    'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
    'Políticas da Empresa',
    'Termos de serviço, políticas de cancelamento e SLA',
    'politica',
    true
  );

-- ============================================================
-- 10. DOCUMENTOS DA BASE DE CONHECIMENTO
-- ============================================================

WITH dominios_sample AS (
  SELECT id, nome FROM dominios_conhecimento 
  WHERE id_empresa = 'e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6'
)
INSERT INTO documentos (
  id,
  id_dominio,
  titulo,
  conteudo,
  tipo,
  tags,
  ativo
)
SELECT
  gen_random_uuid(),
  d.id,
  CASE 
    WHEN d.nome = 'Planos e Preços' THEN 'Tabela de Planos 2026'
    WHEN d.nome = 'Suporte Técnico' THEN 'Como resolver problemas de conexão'
    ELSE 'Política de Cancelamento'
  END,
  CASE 
    WHEN d.nome = 'Planos e Preços' THEN 'Fibra 200MB: R$ 79,90 | Fibra 300MB: R$ 99,90 | Fibra 500MB: R$ 149,90 | Fibra 1GB: R$ 199,90'
    WHEN d.nome = 'Suporte Técnico' THEN '1. Reinicie o roteador. 2. Verifique os cabos. 3. Teste a velocidade. 4. Verifique as luzes do equipamento.'
    ELSE 'Cancelamento com 30 dias de antecedência. Sem multa após 12 meses de contrato.'
  END,
  'texto',
  ARRAY[lower(d.nome)],
  true
FROM dominios_sample d;

COMMIT;

-- ============================================================
-- ✅ Seed completo!
-- ============================================================
-- Execute: psql -h seu-host -U postgres -d postgres -f database/seed.sql
-- Ou via Supabase SQL Editor
-- ============================================================
