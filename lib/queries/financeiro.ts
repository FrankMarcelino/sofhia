import { createClient } from '@/lib/supabase/server';

export interface Carteira {
  id_carteira: string;
  id_empresa: string;
  saldo_creditos: number;
  limite_cheque_especial: number;
  alerta_saldo_baixo: number;
  data_ultima_renovacao: string | null;
  ativo: boolean;
}

export interface Movimentacao {
  id_movimentacao: string;
  created_at: string;
  tipo_operacao: 'CREDITO' | 'DEBITO';
  valor: number;
  saldo_apos: number;
  descricao: string | null;
  id_uso_referencia: number | null;
}

export interface ConsumoAgrupado {
  data: string;
  total: number;
  quantidade: number;
}

export async function getCarteira(empresaId: string): Promise<Carteira | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('carteiras')
    .select('*')
    .eq('id_empresa', empresaId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Carteira;
}

export async function getMovimentacoes(
  empresaId: string,
  limite: number = 20
): Promise<Movimentacao[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('carteiras_movimentacoes')
    .select('*')
    .eq('id_empresa', empresaId)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error || !data) {
    return [];
  }

  return data as Movimentacao[];
}

export async function getConsumoUltimos30Dias(empresaId: string): Promise<ConsumoAgrupado[]> {
  const supabase = await createClient();

  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - 30);

  const { data, error } = await supabase
    .from('usos_ia')
    .select('created_at, custo_total_usd')
    .eq('id_empresa', empresaId)
    .gte('created_at', dataInicio.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  // Agrupar por dia
  const agrupado = new Map<string, { total: number; quantidade: number }>();

  data.forEach((uso) => {
    const dataStr = new Date(uso.created_at).toISOString().split('T')[0];
    const atual = agrupado.get(dataStr) || { total: 0, quantidade: 0 };
    agrupado.set(dataStr, {
      total: atual.total + (uso.custo_total_usd || 0),
      quantidade: atual.quantidade + 1,
    });
  });

  return Array.from(agrupado.entries()).map(([data, valores]) => ({
    data,
    total: valores.total,
    quantidade: valores.quantidade,
  }));
}

export async function getResumoFinanceiro(empresaId: string) {
  const supabase = await createClient();

  const dataInicio30d = new Date();
  dataInicio30d.setDate(dataInicio30d.getDate() - 30);

  const dataInicio7d = new Date();
  dataInicio7d.setDate(dataInicio7d.getDate() - 7);

  // Buscar dados em paralelo
  const [carteira, consumo30d, consumo7d, recargasMes] = await Promise.all([
    getCarteira(empresaId),

    // Consumo últimos 30 dias
    supabase
      .from('usos_ia')
      .select('custo_total_usd')
      .eq('id_empresa', empresaId)
      .gte('created_at', dataInicio30d.toISOString()),

    // Consumo últimos 7 dias
    supabase
      .from('usos_ia')
      .select('custo_total_usd')
      .eq('id_empresa', empresaId)
      .gte('created_at', dataInicio7d.toISOString()),

    // Recargas do mês
    supabase
      .from('carteiras_movimentacoes')
      .select('valor')
      .eq('id_empresa', empresaId)
      .eq('tipo_operacao', 'CREDITO')
      .gte('created_at', dataInicio30d.toISOString()),
  ]);

  const consumoTotal30d = consumo30d.data?.reduce(
    (acc, uso) => acc + (uso.custo_total_usd || 0), 0
  ) || 0;

  const consumoTotal7d = consumo7d.data?.reduce(
    (acc, uso) => acc + (uso.custo_total_usd || 0), 0
  ) || 0;

  const recargasTotalMes = recargasMes.data?.reduce(
    (acc, r) => acc + (r.valor || 0), 0
  ) || 0;

  return {
    saldo: carteira?.saldo_creditos || 0,
    alertaSaldoBaixo: carteira?.alerta_saldo_baixo || 50,
    consumo30d: consumoTotal30d,
    consumo7d: consumoTotal7d,
    mediadiaria: consumoTotal30d / 30,
    recargasMes: recargasTotalMes,
    diasRestantes: carteira?.saldo_creditos
      ? Math.floor(carteira.saldo_creditos / (consumoTotal30d / 30 || 1))
      : 0,
  };
}
