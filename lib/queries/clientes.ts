import { createClient } from '@/lib/supabase/server';
import { logSupabaseWarning } from '@/lib/utils';

export interface TagSimples {
  id_tag: string;
  nome: string;
  cor_hex: string | null;
}

export interface ConversaSimples {
  id_conversa: string;
  created_at: string;
  status_conversa: string;
  conversas_tags: { tags: TagSimples }[];
}

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
  conversas: ConversaSimples[];
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
      observacoes,
      conversas(
        id_conversa,
        created_at,
        status_conversa,
        conversas_tags(
          tags(id_tag, nome, cor_hex)
        )
      )
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

  return (data || []) as unknown as Pessoa[];
}

export async function getTagsEmpresa(empresaId: string): Promise<TagSimples[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tags')
    .select('id_tag, nome, cor_hex')
    .eq('id_empresa', empresaId)
    .order('nome');

  if (error) {
    logSupabaseWarning(error, 'buscar tags');
    return [];
  }

  return data || [];
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
