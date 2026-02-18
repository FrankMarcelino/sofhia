-- =============================================================================
-- Migração: Upload de Imagens — Supabase Storage
-- Data: 2026-02-18
-- Versão: 1.1
-- =============================================================================
--
-- ATENÇÃO: Esta migração tem duas partes com formas de execução diferentes.
--
-- ► PARTE 1 e 3: Execute no SQL Editor do Supabase (este arquivo)
-- ► PARTE 2: Execute manualmente na UI do Supabase (Storage > New Bucket)
--            O SQL Editor não tem permissão para criar buckets diretamente.
--
-- Estrutura de path no bucket: {id_empresa}/{uuid}.{ext}
-- IDEMPOTENTE: pode ser re-executada sem erros.
-- =============================================================================


-- =============================================================================
-- PARTE 1: COLUNA storage_path EM base_conhecimento_geral
-- (url_imagem já existe no schema atual — apenas storage_path é nova)
-- =============================================================================

-- storage_path: caminho interno no bucket (ex: "uuid-empresa/uuid-arquivo.webp")
-- Usado para operações de gerenciamento: delete, replace.
-- NULL indica que url_imagem é uma URL externa (retrocompatibilidade).
ALTER TABLE public.base_conhecimento_geral
  ADD COLUMN IF NOT EXISTS storage_path text;

-- Índice parcial para facilitar futuras auditorias e limpeza de órfãos
CREATE INDEX IF NOT EXISTS idx_base_conhecimento_storage_path
  ON public.base_conhecimento_geral (storage_path)
  WHERE storage_path IS NOT NULL;

COMMENT ON COLUMN public.base_conhecimento_geral.url_imagem IS
  'URL pública da imagem (retrocompatível com URLs externas). '
  'Quando provinda do Storage, aponta para o bucket documentos-imagens. '
  'Consumida pelo N8N para vincular banner de preços à base de conhecimento.';

COMMENT ON COLUMN public.base_conhecimento_geral.storage_path IS
  'Caminho interno no bucket "documentos-imagens". '
  'Formato: {id_empresa}/{uuid}.{ext}. '
  'NULL = URL externa, não gerenciada pelo Storage.';


-- =============================================================================
-- PARTE 2: CRIAR O BUCKET (fazer manualmente na UI do Supabase)
-- =============================================================================
--
-- O SQL Editor não possui permissão para inserir em storage.buckets.
-- Crie o bucket com as seguintes configurações no Dashboard:
--
--   Storage → New bucket
--   ┌─────────────────────────────────────────────────────┐
--   │  Name:               documentos-imagens             │
--   │  Public bucket:      ✅ ON (leitura pública)        │
--   │  File size limit:    5 MB                           │
--   │  Allowed MIME types: image/jpeg, image/png,         │
--   │                      image/webp                     │
--   └─────────────────────────────────────────────────────┘
--
-- Por que público? O N8N e o agente de WhatsApp precisam acessar as
-- imagens sem autenticação. A escrita continua protegida pelo RLS abaixo.
-- =============================================================================


-- =============================================================================
-- PARTE 3: POLÍTICAS RLS NO BUCKET (storage.objects)
-- Execute no SQL Editor APÓS criar o bucket na UI.
-- =============================================================================

-- Remover políticas antigas antes de recriar (idempotência)
DROP POLICY IF EXISTS "imagens_leitura_publica"       ON storage.objects;
DROP POLICY IF EXISTS "imagens_upload_proprio_tenant" ON storage.objects;
DROP POLICY IF EXISTS "imagens_update_proprio_tenant" ON storage.objects;
DROP POLICY IF EXISTS "imagens_delete_proprio_tenant" ON storage.objects;


-- 3.1 LEITURA PÚBLICA
-- Qualquer cliente (autenticado ou não) pode fazer GET nas imagens.
-- Necessário para N8N, agente de WhatsApp e outros consumidores externos.
CREATE POLICY "imagens_leitura_publica"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos-imagens');


-- 3.2 UPLOAD — apenas o próprio tenant
-- O path deve começar com o id_empresa do usuário autenticado.
-- Estrutura obrigatória: "{id_empresa}/{uuid}.{ext}"
-- Impede que uma empresa faça upload na pasta de outra.
CREATE POLICY "imagens_upload_proprio_tenant"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-imagens'
  AND split_part(name, '/', 1)::uuid = public.user_empresa_id()
);


-- 3.3 ATUALIZAÇÃO — apenas o próprio tenant
CREATE POLICY "imagens_update_proprio_tenant"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos-imagens'
  AND split_part(name, '/', 1)::uuid = public.user_empresa_id()
)
WITH CHECK (
  bucket_id = 'documentos-imagens'
  AND split_part(name, '/', 1)::uuid = public.user_empresa_id()
);


-- 3.4 EXCLUSÃO — apenas o próprio tenant
CREATE POLICY "imagens_delete_proprio_tenant"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-imagens'
  AND split_part(name, '/', 1)::uuid = public.user_empresa_id()
);


-- =============================================================================
-- VERIFICAÇÃO (opcional — rode após tudo para confirmar)
-- =============================================================================

-- Confirmar coluna adicionada:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'base_conhecimento_geral'
--   AND column_name = 'storage_path';

-- Confirmar políticas criadas:
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage';
