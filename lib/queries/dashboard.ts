import { createClient } from '@/lib/supabase/server';

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

  // Buscar saldo da empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('saldo')
    .eq('id', empresaId)
    .single();

  // Conversas ativas (hoje)
  const { count: conversasAtivas } = await supabase
    .from('conversas')
    .select('*', { count: 'exact', head: true })
    .eq('id_empresa', empresaId)
    .eq('status', 'ativa');

  // Clientes ativos (com conversas nos últimos 30 dias)
  const { count: clientesAtivos } = await supabase
    .from('pessoas')
    .select('*', { count: 'exact', head: true })
    .eq('id_empresa', empresaId)
    .eq('status', 'ativo');

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
    saldo: empresa?.saldo || 0,
    statusSistema: 'online',
  };
}

interface VendasTrendRaw {
  data: string;
  vendas: number;
  leads: number;
}

/**
 * Buscar tendência de vendas (últimos 7 dias)
 */
export async function getVendasTrend(
  empresaId: string
): Promise<VendasTrend[]> {
  const supabase = await createClient();

  const { data } = await supabase.rpc('buscar_tendencia_vendas', {
    p_empresa_id: empresaId,
    p_dias: 7,
  });

  if (!data) return [];

  return (data as VendasTrendRaw[]).map((item) => ({
    data: new Date(item.data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }),
    vendas: item.vendas || 0,
    leads: item.leads || 0,
  }));
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
  id: string;
  pessoa: { nome: string } | null;
  status: string;
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
  const { data: conversas } = await supabase
    .from('conversas')
    .select('id, pessoa:pessoas(nome), status, created_at')
    .eq('id_empresa', empresaId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!conversas) return [];

  return (conversas as unknown as ConversaRaw[]).map((conversa) => ({
    id: conversa.id,
    tipo: 'conversa' as const,
    titulo: `Nova conversa com ${conversa.pessoa?.nome || 'Cliente'}`,
    descricao: `Status: ${conversa.status}`,
    timestamp: conversa.created_at,
    status: conversa.status === 'ativa' ? ('success' as const) : ('info' as const),
  }));
}
