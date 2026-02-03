import { createClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/utils';

export interface DashboardKPIs {
  conversasAtivas: number;
  clientesAtivos: number;
  agentesAtivos: number;
  taxaConversao: number;
  saldo: number;
  statusSistema: 'online' | 'offline' | 'manutencao';
}

export interface VendasTrend {
  data: string;
  vendas: number;
  leads: number;
}

export interface FunilVendas {
  etapa: string;
  quantidade: number;
  percentual: number;
}

export interface AtividadeRecente {
  id: string;
  tipo: 'conversa' | 'venda' | 'agente' | 'sistema';
  titulo: string;
  descricao: string;
  timestamp: string;
  status: 'success' | 'error' | 'info' | 'warning';
}

/**
 * Buscar KPIs do dashboard
 */
export async function getDashboardKPIs(
  empresaId: string
): Promise<DashboardKPIs> {
  const supabase = await createClient();

  // Buscar saldo da carteira da empresa
  const { data: carteira } = await supabase
    .from('carteiras')
    .select('saldo_creditos')
    .eq('id_empresa', empresaId)
    .single();

  // Conversas ativas (hoje)
  const { count: conversasAtivas } = await supabase
    .from('conversas')
    .select('*', { count: 'exact', head: true })
    .eq('id_empresa', empresaId)
    .eq('status_conversa', 'conversando')
    .eq('encerrada', false);

  // Clientes ativos (total de pessoas cadastradas)
  const { count: clientesAtivos } = await supabase
    .from('pessoas')
    .select('*', { count: 'exact', head: true })
    .eq('id_empresa', empresaId);

  // Agentes ativos
  const { count: agentesAtivos } = await supabase
    .from('agentes')
    .select('*', { count: 'exact', head: true })
    .eq('id_empresa', empresaId)
    .eq('ativo', true);

  // Taxa de conversão (últimos 30 dias)
  const { data: taxaData } = await supabase.rpc(
    'calcular_taxa_conversao_periodo',
    {
      p_empresa_id: empresaId,
      p_dias: 30,
    }
  );

  return {
    conversasAtivas: conversasAtivas || 0,
    clientesAtivos: clientesAtivos || 0,
    agentesAtivos: agentesAtivos || 0,
    taxaConversao: taxaData || 0,
    saldo: carteira?.saldo_creditos || 0,
    statusSistema: 'online',
  };
}

interface VendasTrendRaw {
  data: string;
  valor_total: number;
}

/**
 * Buscar tendência de vendas (últimos 7 dias)
 */
export async function getVendasTrend(
  empresaId: string
): Promise<VendasTrend[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('buscar_tendencia_vendas', {
    p_empresa_id: empresaId,
    p_dias: 7,
  });

  if (error) {
    handleSupabaseError(error, 'buscar tendência de vendas');
  }

  if (!data) return [];

  // buscar_tendencia_vendas retorna { data, valor_total }
  // Precisamos também contar leads para cada dia
  const result: VendasTrend[] = [];
  
  for (const item of data as VendasTrendRaw[]) {
    // Contar leads para o mesmo dia
    const { count: leadsCount } = await supabase
      .from('pessoas')
      .select('*', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .gte('created_at', item.data)
      .lt('created_at', new Date(new Date(item.data).getTime() + 86400000).toISOString());

    result.push({
      data: new Date(item.data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      }),
      vendas: item.valor_total || 0,
      leads: leadsCount || 0,
    });
  }

  return result;
}

interface FunilVendasRaw {
  etapa: string;
  quantidade: number;
  percentual: number;
}

/**
 * Buscar funil de vendas
 */
export async function getFunilVendas(
  empresaId: string
): Promise<FunilVendas[]> {
  const supabase = await createClient();

  const { data } = await supabase.rpc('analisar_funil_vendas', {
    p_empresa_id: empresaId,
    p_dias: 30,
  });

  if (!data || data.length === 0) {
    // Retornar dados padrão se não houver dados
    return [
      { etapa: 'Leads', quantidade: 0, percentual: 100 },
      { etapa: 'Contato', quantidade: 0, percentual: 0 },
      { etapa: 'Proposta', quantidade: 0, percentual: 0 },
      { etapa: 'Negociação', quantidade: 0, percentual: 0 },
      { etapa: 'Fechamento', quantidade: 0, percentual: 0 },
    ];
  }

  return (data as FunilVendasRaw[]).map((item) => ({
    etapa: item.etapa,
    quantidade: item.quantidade || 0,
    percentual: item.percentual || 0,
  }));
}

interface ConversaRaw {
  id_conversa: string;
  pessoa: { nome: string } | null;
  status_conversa: string;
  created_at: string;
}

/**
 * Buscar atividades recentes
 */
export async function getAtividadesRecentes(
  empresaId: string,
  limit: number = 10
): Promise<AtividadeRecente[]> {
  const supabase = await createClient();

  // Buscar últimas conversas
  const { data: conversas, error } = await supabase
    .from('conversas')
    .select('id_conversa, pessoa:pessoas(nome), status_conversa, created_at')
    .eq('id_empresa', empresaId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error, 'buscar atividades recentes');
  }

  if (!conversas) return [];

  return (conversas as unknown as ConversaRaw[]).map((conversa) => ({
    id: conversa.id_conversa,
    tipo: 'conversa' as const,
    titulo: `Nova conversa com ${conversa.pessoa?.nome || 'Cliente'}`,
    descricao: `Status: ${conversa.status_conversa}`,
    timestamp: conversa.created_at,
    status: conversa.status_conversa === 'conversando' ? ('success' as const) : ('info' as const),
  }));
}
