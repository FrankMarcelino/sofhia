-- =============================================================================
-- Migração: Melhorias Base de Conhecimento & Área de Cobertura
-- Data: 2026-02-17
-- =============================================================================

-- 1. Adicionar status 'ARQUIVADO' ao enum STATUS_PUBLICACAO
-- O enum atualmente só tem RASCUNHO e PUBLICADO
ALTER TYPE "STATUS_PUBLICACAO" ADD VALUE IF NOT EXISTS 'ARQUIVADO';

-- 2. Tornar campos obrigatórios na tabela base_conhecimento_geral
-- O campo conteudo já é NOT NULL. Titulo e dominio passam a ser obrigatórios.

-- Primeiro, atualizar registros existentes que possam ter NULL
UPDATE base_conhecimento_geral
SET titulo = 'Sem título'
WHERE titulo IS NULL;

UPDATE base_conhecimento_geral
SET id_dominio = (
  SELECT cd.id_dominio
  FROM conhecimento_dominios cd
  JOIN empresa e ON e.id_neurocore = cd.id_neurocore
  WHERE e.id_empresa = base_conhecimento_geral.id_empresa
  LIMIT 1
)
WHERE id_dominio IS NULL;

-- Agora aplicar as constraints NOT NULL
ALTER TABLE base_conhecimento_geral ALTER COLUMN titulo SET NOT NULL;
ALTER TABLE base_conhecimento_geral ALTER COLUMN id_dominio SET NOT NULL;

-- 3. Garantir RLS na tabela conhecimento_cobertura
-- Habilitar RLS (caso ainda não esteja habilitado)
ALTER TABLE conhecimento_cobertura ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conhecimento_cobertura'
    AND policyname = 'conhecimento_cobertura_select_policy'
  ) THEN
    CREATE POLICY conhecimento_cobertura_select_policy ON conhecimento_cobertura
      FOR SELECT
      USING (
        id_empresa IN (
          SELECT id_empresa FROM usuarios_sofhia WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy de INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conhecimento_cobertura'
    AND policyname = 'conhecimento_cobertura_insert_policy'
  ) THEN
    CREATE POLICY conhecimento_cobertura_insert_policy ON conhecimento_cobertura
      FOR INSERT
      WITH CHECK (
        id_empresa IN (
          SELECT id_empresa FROM usuarios_sofhia WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy de UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conhecimento_cobertura'
    AND policyname = 'conhecimento_cobertura_update_policy'
  ) THEN
    CREATE POLICY conhecimento_cobertura_update_policy ON conhecimento_cobertura
      FOR UPDATE
      USING (
        id_empresa IN (
          SELECT id_empresa FROM usuarios_sofhia WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy de DELETE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conhecimento_cobertura'
    AND policyname = 'conhecimento_cobertura_delete_policy'
  ) THEN
    CREATE POLICY conhecimento_cobertura_delete_policy ON conhecimento_cobertura
      FOR DELETE
      USING (
        id_empresa IN (
          SELECT id_empresa FROM usuarios_sofhia WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
