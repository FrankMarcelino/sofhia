import { createClient } from '@/lib/supabase/server';

export interface Conversa {
  id_conversa: string;
  created_at: string;
  updated_at: string;
  status_conversa: 'conversando' | 'pausado' | 'encerrado' | 'aguardando_humano';
  motivo_da_conversa: 'NAO_IDENTIFICADO' | 'VENDA' | 'SUPORTE' | 'DUVIDA' | 'CANCELAMENTO' | 'OUTRO';
  encerrada: boolean;
  data_ultima_interacao: string;
  pessoa: {
    id_pessoa: string;
    nome: string | null;
    telefone: string | null;
  } | null;
  agente: {
    id_agente: string;
    nome_agente: string;
  } | null;
  _count?: {
    interacoes: number;
  };
}

export interface Interacao {
  id_interacao: string;
  created_at: string;
  remetente: string;
  mensagem_texto: string | null;
  tipo_mensagem: string;
}

export interface FiltrosConversa {
  status?: string;
  motivo?: string;
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
}

export async function getConversas(
  empresaId: string,
  filtros?: FiltrosConversa,
  limite: number = 50
): Promise<Conversa[]> {
  const supabase = await createClient();

  let query = supabase
    .from('conversas')
    .select(`
      id_conversa,
      created_at,
      updated_at,
      status_conversa,
      motivo_da_conversa,
      encerrada,
      data_ultima_interacao,
      pessoa:pessoas(id_pessoa, nome, telefone),
      agente:agentes(id_agente, nome_agente)
    `)
    .eq('id_empresa', empresaId)
    .order('data_ultima_interacao', { ascending: false })
    .limit(limite);

  // Aplicar filtros
  if (filtros?.status && filtros.status !== 'todos') {
    query = query.eq('status_conversa', filtros.status);
  }

  if (filtros?.motivo && filtros.motivo !== 'todos') {
    query = query.eq('motivo_da_conversa', filtros.motivo);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error('Erro ao buscar conversas:', error);
    return [];
  }

  return data as unknown as Conversa[];
}

export async function getConversa(conversaId: string): Promise<Conversa | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('conversas')
    .select(`
      id_conversa,
      created_at,
      updated_at,
      status_conversa,
      motivo_da_conversa,
      encerrada,
      data_ultima_interacao,
      pessoa:pessoas(id_pessoa, nome, telefone),
      agente:agentes(id_agente, nome_agente)
    `)
    .eq('id_conversa', conversaId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as Conversa;
}

export async function getInteracoes(conversaId: string): Promise<Interacao[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interacoes')
    .select('*')
    .eq('id_conversa', conversaId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Interacao[];
}

export async function getEstatisticasConversas(empresaId: string) {
  const supabase = await createClient();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [totalAtivas, totalHoje, aguardandoHumano, encerradasHoje] = await Promise.all([
    // Conversas ativas
    supabase
      .from('conversas')
      .select('id_conversa', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .eq('encerrada', false),

    // Conversas de hoje
    supabase
      .from('conversas')
      .select('id_conversa', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .gte('created_at', hoje.toISOString()),

    // Aguardando humano
    supabase
      .from('conversas')
      .select('id_conversa', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .eq('status_conversa', 'aguardando_humano'),

    // Encerradas hoje
    supabase
      .from('conversas')
      .select('id_conversa', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .eq('encerrada', true)
      .gte('updated_at', hoje.toISOString()),
  ]);

  return {
    ativas: totalAtivas.count || 0,
    hoje: totalHoje.count || 0,
    aguardandoHumano: aguardandoHumano.count || 0,
    encerradasHoje: encerradasHoje.count || 0,
  };
}
