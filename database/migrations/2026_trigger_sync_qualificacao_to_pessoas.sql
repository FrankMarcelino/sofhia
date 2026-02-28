-- =============================================================================
-- Migração: Trigger de sincronização pessoas_dados_qualificacao → pessoas
-- Data: 2026-02-28
-- =============================================================================
--
-- OBJETIVO:
--   Quando a IA salva um dado em pessoas_dados_qualificacao com confiança
--   suficiente, atualizar automaticamente a coluna correspondente em pessoas.
--
-- LÓGICA DE MAPEAMENTO:
--   Usa agente_extracoes.tipo_chave_normatizada (enum controlado) em vez do
--   campo "chave" (texto livre). Assim, diferentes agentes que usam nomes
--   distintos (ex: "cpf", "documento_cpf") mas apontam para o mesmo
--   tipo_chave_normatizada resultam na atualização correta da coluna.
--
-- REGRAS:
--   1. Só sincroniza se id_agente_extracoes NÃO for NULL (dado veio da IA).
--   2. Só sincroniza se confianca_ia >= 80.
--   3. Só atualiza se o valor atual em pessoas for NULL (não sobrescreve
--      dado já confirmado pelo usuário). Remova a condição IS NULL se quiser
--      que a IA sempre sobrescreva.
--   4. Tipos não mapeados (ex: provedor_atual, plano_interesse) são ignorados.
--
-- ENUM:
--   O tipo normalizado usa o enum "tipos_chave_extracao_dados".
--   Valores confirmados:
--   nome_pessoa_fisica, nome_pessoa_juridica, cpf, cnpj, rg, telefone,
--   email, cep, pais, estado, logradouro, bairro, cidade, data_nascimento,
--   telefone_2, numero_casa, valor_total, valor_mensalidade, plano_escolhido,
--   dia_vencimento, servicos_adicionais
--
-- IDEMPOTENTE: pode ser re-executada sem erros.
-- =============================================================================


-- =============================================================================
-- FUNÇÃO DO TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_qualificacao_to_pessoa()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo_chave text;
BEGIN

  -- Sem agente_extracoes vinculado = dado sem tipo normalizado, ignorar
  IF NEW.id_agente_extracoes IS NULL THEN
    RETURN NEW;
  END IF;

  -- Confiança insuficiente, não promover para pessoas
  IF NEW.confianca_ia < 80 THEN
    RETURN NEW;
  END IF;

  -- Buscar tipo_chave_normatizada do agente de extração responsável
  SELECT tipo_chave_normatizada::text
  INTO v_tipo_chave
  FROM public.agente_extracoes
  WHERE id_agente_extracoes = NEW.id_agente_extracoes;

  -- Sem tipo normalizado definido para este agente de extração, ignorar
  IF v_tipo_chave IS NULL THEN
    RETURN NEW;
  END IF;

  -- -------------------------------------------------------------------------
  -- Mapeamento: tipo_chave_normatizada → coluna em pessoas
  --
  -- Ajuste os valores do WHEN conforme o enum real do seu banco.
  -- Só atualiza se a coluna em pessoas ainda for NULL (dado não confirmado).
  -- Para sempre sobrescrever, remova o "AND coluna IS NULL" de cada UPDATE.
  -- -------------------------------------------------------------------------
  CASE v_tipo_chave

    -- Nome: PF e PJ mapeiam para a mesma coluna
    WHEN 'nome_pessoa_fisica', 'nome_pessoa_juridica' THEN
      UPDATE public.pessoas
      SET nome = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND nome IS NULL;

    WHEN 'email' THEN
      UPDATE public.pessoas
      SET email = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND email IS NULL;

    WHEN 'telefone' THEN
      UPDATE public.pessoas
      SET telefone = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND telefone IS NULL;

    WHEN 'cpf' THEN
      UPDATE public.pessoas
      SET cpf = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND cpf IS NULL;

    WHEN 'rg' THEN
      UPDATE public.pessoas
      SET rg = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND rg IS NULL;

    WHEN 'cnpj' THEN
      UPDATE public.pessoas
      SET cnpj = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND cnpj IS NULL;

    -- logradouro da IA → coluna endereco em pessoas
    WHEN 'logradouro' THEN
      UPDATE public.pessoas
      SET endereco = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND endereco IS NULL;

    WHEN 'bairro' THEN
      UPDATE public.pessoas
      SET bairro = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND bairro IS NULL;

    WHEN 'cidade' THEN
      UPDATE public.pessoas
      SET cidade = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND cidade IS NULL;

    WHEN 'estado' THEN
      UPDATE public.pessoas
      SET estado = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND estado IS NULL;

    WHEN 'cep' THEN
      UPDATE public.pessoas
      SET cep = NEW.valor, updated_at = now()
      WHERE id_pessoa = NEW.id_pessoa
        AND cep IS NULL;

    ELSE
      -- Sem coluna correspondente em pessoas: pais, data_nascimento,
      -- telefone_2, numero_casa, valor_total, valor_mensalidade,
      -- plano_escolhido, dia_vencimento, servicos_adicionais.
      -- Ficam apenas em pessoas_dados_qualificacao.
      NULL;

  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- TRIGGER
-- =============================================================================

-- Remove trigger anterior se existir (idempotência)
DROP TRIGGER IF EXISTS trg_sync_qualificacao_to_pessoa
  ON public.pessoas_dados_qualificacao;

-- Dispara após INSERT ou UPDATE em qualquer linha de qualificação
CREATE TRIGGER trg_sync_qualificacao_to_pessoa
AFTER INSERT OR UPDATE ON public.pessoas_dados_qualificacao
FOR EACH ROW
EXECUTE FUNCTION sync_qualificacao_to_pessoa();


-- =============================================================================
-- VERIFICAÇÃO (opcional — rode manualmente para conferir)
-- =============================================================================

-- Liste os valores reais do enum tipo_chave_normatizada:
-- SELECT unnest(enum_range(NULL::"TIPO_CHAVE_NORMATIZADA"));

-- Verifique se o trigger foi criado:
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table = 'pessoas_dados_qualificacao';

-- Verifique os valores do enum:
-- SELECT unnest(enum_range(NULL::tipos_chave_extracao_dados));
