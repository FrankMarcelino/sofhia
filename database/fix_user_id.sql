-- ============================================================
-- FIX: Adicionar user ID atual à tabela usuarios_sofhia
-- ============================================================
-- Este script adiciona o user ID que está atualmente logado
-- na aplicação à tabela usuarios_sofhia, vinculando-o à
-- empresa de teste existente.
-- ============================================================

-- Verificar se o user já existe (não deve existir)
SELECT * FROM usuarios_sofhia WHERE id = '90d04e82-6619-48fc-8aee-84e68b77edd6';

-- Adicionar o user atual à tabela usuarios_sofhia
INSERT INTO usuarios_sofhia (
  id,
  id_empresa,
  nome_usuario,
  ativo
) VALUES (
  '90d04e82-6619-48fc-8aee-84e68b77edd6',  -- User ID atual (logado)
  'e1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6',  -- Empresa de teste
  'Frank Silva',
  true
) ON CONFLICT (id) DO UPDATE SET
  id_empresa = EXCLUDED.id_empresa,
  nome_usuario = EXCLUDED.nome_usuario,
  ativo = EXCLUDED.ativo;

-- Verificar se foi inserido
SELECT * FROM usuarios_sofhia WHERE id = '90d04e82-6619-48fc-8aee-84e68b77edd6';

-- ============================================================
-- ✅ Pronto! Agora o user ID atual está vinculado à empresa
-- ============================================================
