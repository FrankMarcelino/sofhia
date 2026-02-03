import { createClient } from '@/lib/supabase/server';
import { logSupabaseWarning } from '@/lib/utils';

export interface ModeloIA {
  id_modelo: string;
  nome_modelo: string;
  provedor: string;
  custo_input: number;
  custo_output: number;
}

export interface Agente {
  id_agente: string;
  nome_agente: string;
  persona: string;
  tom_voz: string;
  objetivo: string;
  instrucoes: string[];
  limitacoes: string[];
  roteiro: string[];
  meio_comunicacao: string | null;
  ativo: boolean;
  nome_agente_identificador: string | null;
  sexo_agente: string | null;
  id_modelo_ia: string;
  grupo_teste_ab: string | null;
  peso_distribuicao: number;
}

export interface Extracao {
  id_agente_extracoes: string;
  informacao_para_extrair: string;
  descricao_para_ia: string;
  tipo_dado: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'cpf' | 'cnpj';
}

export async function getModelosIA(): Promise<ModeloIA[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ia_modelos')
    .select('*')
    .eq('ativo', true)
    .order('provedor', { ascending: true })
    .order('nome_modelo', { ascending: true });

  if (error) {
    logSupabaseWarning(error, 'buscar modelos de IA');
    return [];
  }

  return data || [];
}

export async function getAgente(empresaId: string): Promise<Agente | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agentes')
    .select('*')
    .eq('id_empresa', empresaId)
    .single();

  if (error || !data) {
    // Se não houver agente, retornar null (será criado um novo)
    return null;
  }

  return data as Agente;
}

export async function getExtracoes(agenteId: string): Promise<Extracao[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('agente_extracoes')
    .select('*')
    .eq('id_agente', agenteId)
    .order('created_at', { ascending: true });

  if (error) {
    logSupabaseWarning(error, 'buscar extrações');
    return [];
  }

  return data || [];
}

// ============================================================================
// BASE DE CONHECIMENTO
// ============================================================================

export interface Dominio {
  id_dominio: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  _count?: number; // Contagem de documentos
}

export interface Documento {
  id: string;
  id_dominio: string | null;
  titulo: string | null;
  conteudo: string;
  created_at: string;
  dominio?: {
    nome: string;
  };
}

export async function getDominios(empresaId: string): Promise<Dominio[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('conhecimento_dominios')
    .select('*')
    .eq('id_empresa', empresaId)
    .order('nome', { ascending: true });

  if (error) {
    logSupabaseWarning(error, 'buscar domínios');
    return [];
  }

  return data || [];
}

export async function getDocumentos(empresaId: string, dominioId?: string): Promise<Documento[]> {
  const supabase = await createClient();

  let query = supabase
    .from('base_conhecimento_geral')
    .select(`
      *,
      dominio:conhecimento_dominios(nome)
    `)
    .eq('id_empresa', empresaId);

  if (dominioId) {
    query = query.eq('id_dominio', dominioId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    logSupabaseWarning(error, 'buscar documentos');
    return [];
  }

  return data || [];
}

export async function getDocumentoById(documentoId: string): Promise<Documento | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('base_conhecimento_geral')
    .select(`
      *,
      dominio:conhecimento_dominios(nome)
    `)
    .eq('id', documentoId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
