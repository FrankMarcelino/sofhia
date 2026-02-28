import { createClient } from '@/lib/supabase/server';
import { logSupabaseWarning } from '@/lib/utils';

export interface Conversa {
  id_conversa: string;
  created_at: string;
  updated_at: string;
  status_conversa: 'ia_conversando' | 'pausado' | 'encerrado' | 'aguardando_humano';
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

  const { data, error } = await query;

  if (error) {
    logSupabaseWarning(error, 'buscar conversas');
    return [];
  }

  if (!data) {
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
    // Conversas ativas (não encerradas)
    supabase
      .from('conversas')
      .select('id_conversa', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .neq('status_conversa', 'encerrado'),

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
      .eq('status_conversa', 'encerrado')
      .gte('updated_at', hoje.toISOString()),
  ]);

  return {
    ativas: totalAtivas.count || 0,
    hoje: totalHoje.count || 0,
    aguardandoHumano: aguardandoHumano.count || 0,
    encerradasHoje: encerradasHoje.count || 0,
  };
}
