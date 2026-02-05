-- ============================================================================
-- MIGRAÇÃO: Adicionar campos rules e others_instructions na tabela agentes
-- ============================================================================
--
-- Adiciona novos campos JSONB para configuração completa do agente:
-- - rules: Regras de comportamento
-- - others_instructions: Outras instruções adicionais
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Data: 2026-02-05
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASSO 1: Adicionar coluna rules (JSONB)
-- ============================================================================

ALTER TABLE public.agentes
ADD COLUMN IF NOT EXISTS rules jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.agentes.rules IS 'Regras de comportamento do agente (estrutura GuidelineStep[])';

-- ============================================================================
-- PASSO 2: Adicionar coluna others_instructions (JSONB)
-- ============================================================================

ALTER TABLE public.agentes
ADD COLUMN IF NOT EXISTS others_instructions jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.agentes.others_instructions IS 'Outras instruções adicionais do agente (estrutura GuidelineStep[])';

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================================================
-- Execute para verificar se a migração foi bem-sucedida:
--
-- SELECT
--   id_agente,
--   nome_agente,
--   rules,
--   others_instructions
-- FROM agentes
-- LIMIT 5;
--
-- \d agentes  -- Para ver estrutura da tabela
-- ============================================================================
