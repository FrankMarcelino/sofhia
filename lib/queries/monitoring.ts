import { createClient } from '@/lib/supabase/server';

export interface UpChatConfig {
  id_config: string;
  company_name: string | null;
  api_global_token_upchat: string;
  url_provedor_upchat: string | null;
  url_socket_upchat: string | null;
  url_eventos_upchat: string | null;
  usuario_upchat: string | null;
  queue_id: string | null;
  updated_at: string | null;
}

export interface HealthStatus {
  api: 'online' | 'offline' | 'checking';
  token: 'valid' | 'invalid' | 'checking';
  user: 'active' | 'inactive' | 'checking';
  lastCheck: string;
}

export async function getUpChatConfig(empresaId: string): Promise<UpChatConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('configuracoes_upchat')
    .select('*')
    .eq('id_empresa', empresaId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UpChatConfig;
}

export async function getSystemStats(empresaId: string) {
  const supabase = await createClient();

  // Buscar estatísticas em paralelo
  const [conversasResult, agentesResult, usosResult] = await Promise.all([
    // Conversas ativas hoje
    supabase
      .from('conversas')
      .select('id_conversa', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .eq('encerrada', false),

    // Agentes ativos
    supabase
      .from('agentes')
      .select('id_agente', { count: 'exact', head: true })
      .eq('id_empresa', empresaId)
      .eq('ativo', true),

    // Usos de IA hoje
    supabase
      .from('usos_ia')
      .select('tokens_total')
      .eq('id_empresa', empresaId)
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  const tokensHoje = usosResult.data?.reduce((acc, uso) => acc + (uso.tokens_total || 0), 0) || 0;

  return {
    conversasAtivas: conversasResult.count || 0,
    agentesAtivos: agentesResult.count || 0,
    tokensHoje,
    requisicoesPorMinuto: Math.floor(Math.random() * 15) + 5, // Mock por enquanto
  };
}

// Simula um health check da API UpChat
export async function checkUpChatHealth(config: UpChatConfig | null): Promise<HealthStatus> {
  // Por enquanto, simulamos o status baseado na presença de configurações
  const hasToken = !!config?.api_global_token_upchat;
  const hasUrl = !!config?.url_provedor_upchat;
  const hasUser = !!config?.usuario_upchat;

  return {
    api: hasUrl ? 'online' : 'offline',
    token: hasToken ? 'valid' : 'invalid',
    user: hasUser ? 'active' : 'inactive',
    lastCheck: new Date().toISOString(),
  };
}
