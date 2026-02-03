-- ============================================================
-- ESPELHAMENTO AUTOMÁTICO: auth.users → public.usuarios_sofhia
-- ============================================================
-- Este script cria um trigger que automaticamente cria uma
-- entrada em usuarios_sofhia quando um novo usuário é criado
-- no Supabase Auth (auth.users).
-- ============================================================

-- Passo 1: Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir novo usuário em usuarios_sofhia
  -- IMPORTANTE: id_empresa DEVE vir do metadata durante o cadastro!
  INSERT INTO public.usuarios_sofhia (
    id,
    id_empresa,
    nome_usuario,
    ativo
  ) VALUES (
    NEW.id,
    -- Prioridade: 1. Metadata, 2. Empresa padrão para testes
    COALESCE(
      (NEW.raw_user_meta_data->>'id_empresa')::UUID,
      'e1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6'  -- Fallback para testes
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'nome',
      NEW.email,
      'Novo Usuário'
    ),
    true
  );
  
  RETURN NEW;
END;
$$;

-- Passo 2: Criar trigger em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ✅ PRONTO! Agora todo novo usuário em auth.users será
-- automaticamente espelhado em usuarios_sofhia
-- ============================================================

-- Passo 3 (OPCIONAL): Espelhar usuários existentes que ainda não estão em usuarios_sofhia
INSERT INTO public.usuarios_sofhia (id, id_empresa, nome_usuario, ativo)
SELECT 
  au.id,
  'e1a2b3c4-d5e6-47a8-b9c0-d1e2f3a4b5c6' as id_empresa,  -- Empresa padrão de teste
  COALESCE(au.raw_user_meta_data->>'nome', au.email, 'Usuário Existente') as nome_usuario,
  true as ativo
FROM auth.users au
LEFT JOIN public.usuarios_sofhia us ON au.id = us.id
WHERE us.id IS NULL  -- Só inserir se NÃO existir ainda
ON CONFLICT (id) DO NOTHING;

-- Verificar o resultado
SELECT 
  au.id,
  au.email,
  us.nome_usuario,
  us.id_empresa,
  us.ativo
FROM auth.users au
LEFT JOIN public.usuarios_sofhia us ON au.id = us.id
ORDER BY au.created_at DESC;
