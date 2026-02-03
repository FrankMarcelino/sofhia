/**
 * CADASTRO COM MULTI-TENANCY
 * 
 * Este módulo implementa o cadastro de usuários com criação
 * automática de tenant (empresa) ou vinculação a tenant existente.
 */

import { createClient } from '@/lib/supabase/client';

export interface SignUpWithTenantParams {
  email: string;
  password: string;
  nome: string;
  // Opção 1: Criar nova empresa
  empresa?: {
    nome: string;
    cnpj?: string;
    cidade?: string;
    telefone?: string;
  };
  // Opção 2: Vincular a empresa existente (via convite)
  empresaId?: string;
}

export interface SignUpResult {
  success: boolean;
  userId?: string;
  empresaId?: string;
  error?: string;
}

/**
 * Cadastra novo usuário criando ou vinculando a uma empresa
 */
export async function signUpWithTenant(
  params: SignUpWithTenantParams
): Promise<SignUpResult> {
  const supabase = createClient();

  try {
    // PASSO 1: Criar empresa se necessário
    let empresaId = params.empresaId;

    if (!empresaId && params.empresa) {
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresa')
        .insert({
          nome: params.empresa.nome,
          cnpj: params.empresa.cnpj,
          cidade: params.empresa.cidade,
          telefone: params.empresa.telefone,
          email: params.email,
          status_empresa: 'ATIVO',
          id_plano: '22222222-2222-2222-2222-222222222222', // Plano padrão
          id_neurocore: '11111111-1111-1111-1111-111111111111', // Neurocore padrão
        })
        .select('id_empresa')
        .single();

      if (empresaError) {
        return {
          success: false,
          error: `Erro ao criar empresa: ${empresaError.message}`,
        };
      }

      empresaId = empresaData.id_empresa;

      // Criar carteira para a empresa
      await supabase.from('carteiras').insert({
        id_empresa: empresaId,
        saldo_creditos: 0,
        limite_cheque_especial: 500,
        alerta_saldo_baixo: 100,
        ativo: true,
      });
    }

    if (!empresaId) {
      return {
        success: false,
        error: 'É necessário fornecer empresa ou empresaId',
      };
    }

    // PASSO 2: Criar usuário no Supabase Auth com metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          nome: params.nome,
          id_empresa: empresaId, // ← PASSA PARA O TRIGGER!
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: `Erro ao criar usuário: ${authError.message}`,
      };
    }

    // PASSO 3: O trigger handle_new_user() irá criar automaticamente
    // a entrada em usuarios_sofhia usando o id_empresa do metadata!

    return {
      success: true,
      userId: authData.user?.id,
      empresaId: empresaId,
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro inesperado: ${error}`,
    };
  }
}

/**
 * EXEMPLO DE USO NO FRONTEND:
 * 
 * // Cadastro com nova empresa
 * const result = await signUpWithTenant({
 *   email: 'cliente@exemplo.com',
 *   password: 'senha123',
 *   nome: 'João Silva',
 *   empresa: {
 *     nome: 'Empresa XYZ LTDA',
 *     cnpj: '12.345.678/0001-90',
 *     cidade: 'São Paulo'
 *   }
 * });
 * 
 * // Cadastro vinculando a empresa existente (convite)
 * const result = await signUpWithTenant({
 *   email: 'colaborador@exemplo.com',
 *   password: 'senha123',
 *   nome: 'Maria Santos',
 *   empresaId: 'uuid-da-empresa'
 * });
 */
