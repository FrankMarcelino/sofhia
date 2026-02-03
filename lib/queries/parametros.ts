import { createClient } from '@/lib/supabase/server';
import { logSupabaseWarning } from '@/lib/utils';

export interface Empresa {
  id_empresa: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  telefone: string | null;
  site: string | null;
  instagram: string | null;
  email: string | null;
  status_empresa: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
}

export interface UpChatConfig {
  id_config?: string;
  company_name: string | null;
  api_global_token_upchat: string;
  url_provedor_upchat: string | null;
  url_socket_upchat: string | null;
  url_eventos_upchat: string | null;
  usuario_upchat: string | null;
  senha_upchat: string | null;
  queue_id: string | null;
}

export interface PreferenciasIA {
  id_preferencia?: string;
  transcrever_audio_cliente: boolean;
  responder_em_audio_se_receber_audio: boolean;
  extrair_dados_documentos: boolean;
  simular_digitacao: boolean;
  tempo_medio_digitacao_segundos: number;
  maximo_tentativas_ia: number;
  transbordo_automatico_erro: boolean;
  nome_fila_transbordo: string | null;
  buffer_time: number;
}

export interface RegraReativacao {
  id_regra: string;
  sequencia: number;
  tempo_espera_minutos: number;
  tipo_acao: 'MENSAGEM' | 'TRANSBORDO';
  mensagem_texto: string | null;
  ativo: boolean;
}

export async function getEmpresa(empresaId: string): Promise<Empresa | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('empresa')
    .select('*')
    .eq('id_empresa', empresaId)
    .single();

  if (error) {
    logSupabaseWarning(error, 'buscar empresa');
    return null;
  }

  if (!data) {
    return null;
  }

  return data as Empresa;
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

export async function getPreferenciasIA(empresaId: string): Promise<PreferenciasIA | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('empresa_preferencias_ia')
    .select('*')
    .eq('id_empresa', empresaId)
    .single();

  if (error || !data) {
    // Retorna valores padrão se não existir
    return {
      transcrever_audio_cliente: true,
      responder_em_audio_se_receber_audio: false,
      extrair_dados_documentos: true,
      simular_digitacao: true,
      tempo_medio_digitacao_segundos: 3,
      maximo_tentativas_ia: 3,
      transbordo_automatico_erro: true,
      nome_fila_transbordo: null,
      buffer_time: 9,
    };
  }

  return data as PreferenciasIA;
}

export async function getRegrasReativacao(empresaId: string): Promise<RegraReativacao[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('regras_reativacao')
    .select('*')
    .eq('id_empresa', empresaId)
    .order('sequencia', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as RegraReativacao[];
}
