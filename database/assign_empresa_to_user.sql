-- ============================================================
-- ATRIBUIR EMPRESA AO USUÁRIO ATUAL
-- ============================================================
-- Depois de executar auto_mirror_users.sql, use este script
-- para atribuir a empresa de teste ao usuário atual
-- ============================================================

-- Atualizar o usuário atual com a empresa de teste
UPDATE public.usuarios_sofhia
SET 
  id_empresa = 'e1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6',
  nome_usuario = 'Frank Silva'
WHERE id = '90d04e82-6619-48fc-8aee-84e68b77edd6';

-- Verificar o resultado
SELECT * FROM public.usuarios_sofhia 
WHERE id = '90d04e82-6619-48fc-8aee-84e68b77edd6';
