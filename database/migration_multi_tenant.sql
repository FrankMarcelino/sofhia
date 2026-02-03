-- ============================================================
-- MIGRAÇÃO MULTI-TENANT: Bubble → SOFHIA
-- ============================================================
-- Script para migrar usuários e empresas do Bubble
-- Cada usuário terá seu próprio tenant (empresa)
-- ============================================================

-- PASSO 1: Criar função de migração de empresa + usuário
CREATE OR REPLACE FUNCTION public.migrate_user_with_tenant(
  p_user_email TEXT,
  p_user_password TEXT,
  p_user_name TEXT,
  p_empresa_nome TEXT,
  p_empresa_cnpj TEXT DEFAULT NULL,
  p_empresa_cidade TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  empresa_id UUID,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_empresa_id UUID;
  v_neurocore_id UUID := '11111111-1111-1111-1111-111111111111'; -- Neurocore padrão
  v_plano_id UUID := '22222222-2222-2222-2222-222222222222';     -- Plano padrão
BEGIN
  -- 1. Criar empresa
  INSERT INTO public.empresa (
    id_empresa,
    nome,
    cnpj,
    cidade,
    email,
    status_empresa,
    id_plano,
    id_neurocore
  ) VALUES (
    gen_random_uuid(),
    p_empresa_nome,
    p_empresa_cnpj,
    p_empresa_cidade,
    p_user_email,
    'ATIVO',
    v_plano_id,
    v_neurocore_id
  )
  RETURNING id_empresa INTO v_empresa_id;

  -- 2. Criar carteira para a empresa
  INSERT INTO public.carteiras (
    id_carteira,
    id_empresa,
    saldo_creditos,
    limite_cheque_especial,
    alerta_saldo_baixo,
    ativo
  ) VALUES (
    gen_random_uuid(),
    v_empresa_id,
    0.00,           -- Saldo inicial zero
    500.00,         -- Cheque especial padrão
    100.00,         -- Alerta saldo baixo
    true
  );

  -- 3. Criar usuário no Supabase Auth
  -- NOTA: Isso precisa ser feito via API do Supabase Admin
  -- Aqui apenas retornamos os dados para uso no backend
  
  RETURN QUERY SELECT 
    NULL::UUID as user_id,
    v_empresa_id as empresa_id,
    TRUE as success,
    'Empresa criada. Use Supabase Admin API para criar usuário.' as message;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    NULL::UUID,
    NULL::UUID,
    FALSE,
    SQLERRM;
END;
$$;

-- ============================================================
-- EXEMPLO DE USO (executar no backend):
-- ============================================================
-- SELECT * FROM public.migrate_user_with_tenant(
--   'cliente@exemplo.com',
--   'senha_temporaria',
--   'João Silva',
--   'Empresa XYZ LTDA',
--   '12.345.678/0001-90',
--   'São Paulo'
-- );
