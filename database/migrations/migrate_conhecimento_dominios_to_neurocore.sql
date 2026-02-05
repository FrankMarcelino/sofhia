-- ============================================================================
-- MIGRAÇÃO: conhecimento_dominios de id_empresa para id_neurocore
-- ============================================================================
--
-- Esta migração altera a tabela conhecimento_dominios para usar id_neurocore
-- em vez de id_empresa, já que domínios de conhecimento são a nível de Neurocore.
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Data: 2026-02-05
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASSO 1: Adicionar nova coluna id_neurocore
-- ============================================================================

ALTER TABLE public.conhecimento_dominios
ADD COLUMN IF NOT EXISTS id_neurocore uuid;

-- ============================================================================
-- PASSO 2: Migrar dados existentes (pegar id_neurocore via empresa)
-- ============================================================================

UPDATE public.conhecimento_dominios cd
SET id_neurocore = e.id_neurocore
FROM public.empresa e
WHERE cd.id_empresa = e.id_empresa
  AND cd.id_neurocore IS NULL;

-- ============================================================================
-- PASSO 3: Definir coluna como NOT NULL (após migração dos dados)
-- ============================================================================

ALTER TABLE public.conhecimento_dominios
ALTER COLUMN id_neurocore SET NOT NULL;

-- ============================================================================
-- PASSO 4: Remover políticas RLS antigas que dependem de id_empresa
-- ============================================================================

DROP POLICY IF EXISTS "Tenant Isolation" ON public.conhecimento_dominios;
DROP POLICY IF EXISTS "usuarios_veem_dominios_empresa" ON public.conhecimento_dominios;
DROP POLICY IF EXISTS "usuarios_criam_dominios_empresa" ON public.conhecimento_dominios;
DROP POLICY IF EXISTS "usuarios_deletam_dominios_empresa" ON public.conhecimento_dominios;

-- ============================================================================
-- PASSO 5: Remover coluna id_empresa (não mais necessária)
-- ============================================================================

ALTER TABLE public.conhecimento_dominios
DROP CONSTRAINT IF EXISTS conhecimento_dominios_empresa_fk;

ALTER TABLE public.conhecimento_dominios
DROP COLUMN IF EXISTS id_empresa;

-- ============================================================================
-- PASSO 6: Adicionar nova FK para neurocores
-- ============================================================================

ALTER TABLE public.conhecimento_dominios
ADD CONSTRAINT conhecimento_dominios_neurocore_fk
FOREIGN KEY (id_neurocore) REFERENCES public.neurocores(id_neurocore);

-- ============================================================================
-- PASSO 7: Criar índice para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_conhecimento_dominios_neurocore
ON public.conhecimento_dominios(id_neurocore);

-- ============================================================================
-- PASSO 8: Atualizar/Criar função auxiliar para RLS
-- ============================================================================

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
-- PASSO 9: Criar novas políticas RLS para conhecimento_dominios
-- ============================================================================

-- SELECT
DROP POLICY IF EXISTS "usuarios_veem_dominios_neurocore" ON public.conhecimento_dominios;
CREATE POLICY "usuarios_veem_dominios_neurocore" ON public.conhecimento_dominios
  FOR SELECT
  USING (id_neurocore = public.user_neurocore_id());

-- INSERT
DROP POLICY IF EXISTS "usuarios_criam_dominios_neurocore" ON public.conhecimento_dominios;
CREATE POLICY "usuarios_criam_dominios_neurocore" ON public.conhecimento_dominios
  FOR INSERT
  WITH CHECK (id_neurocore = public.user_neurocore_id());

-- DELETE
DROP POLICY IF EXISTS "usuarios_deletam_dominios_neurocore" ON public.conhecimento_dominios;
CREATE POLICY "usuarios_deletam_dominios_neurocore" ON public.conhecimento_dominios
  FOR DELETE
  USING (id_neurocore = public.user_neurocore_id());

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================================================
-- Execute para verificar se a migração foi bem-sucedida:
--
-- SELECT
--   id_dominio,
--   id_neurocore,
--   nome,
--   descricao
-- FROM conhecimento_dominios
-- LIMIT 10;
--
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename = 'conhecimento_dominios';
-- ============================================================================
