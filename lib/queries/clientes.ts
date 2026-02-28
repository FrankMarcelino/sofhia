import { createClient } from '@/lib/supabase/server';
import { logSupabaseWarning } from '@/lib/utils';

export interface Pessoa {
  id_pessoa: string;
  created_at: string;
  updated_at: string;
  id_empresa: string;
  nome: string | null;
  identificador_para_mensageiros: string | null;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  rg: string | null;
  cnpj: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
}

export interface FiltrosPessoa {
  busca?: string;
}

export async function getPessoas(
  empresaId: string,
  filtros?: FiltrosPessoa,
  limite: number = 100
): Promise<Pessoa[]> {
  const supabase = await createClient();

  let query = supabase
    .from('pessoas')
    .select(`
      id_pessoa,
      created_at,
      updated_at,
      id_empresa,
      nome,
      identificador_para_mensageiros,
      telefone,
      email,
      cpf,
      rg,
      cnpj,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      observacoes
    `)
    .eq('id_empresa', empresaId)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (filtros?.busca) {
    query = query.or(
      `nome.ilike.%${filtros.busca}%,telefone.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseWarning(error, 'buscar clientes');
    return [];
  }

  return (data || []) as Pessoa[];
}

export async function getTotalPessoas(empresaId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('pessoas')
    .select('id_pessoa', { count: 'exact', head: true })
    .eq('id_empresa', empresaId);

  if (error) {
    logSupabaseWarning(error, 'contar clientes');
    return 0;
  }

  return count || 0;
}
