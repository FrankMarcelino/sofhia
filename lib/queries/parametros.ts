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
  tipo_acao: string;
  mensagem_texto: string | null;
  ativo: boolean;
  id_tag: string | null;
  id_transferencia_departamento: string | null;
  tempo_inicio: string | null;
  tempo_fim: string | null;
}

export interface Tag {
  id_tag: string;
  nome: string;
  cor_hex: string;
}

export interface Departamento {
  id: string;
  departamento: string;
  descricao_conversa_para_ia: string;
  ativo: boolean;
}

export interface PreferenciasReativacao {
  id_preferencia?: string;
  maximo_tentativas_reativacoes_ia: number;
  maximo_tempo_reativacoes_por_inatividade: number;
  acao_apos_maximo_tentativas_reativacoes_ia: string;
  acao_apos_maximo_tempo_reativacoes_por_inatividade: string;
}

export async function getPreferenciasReativacao(empresaId: string): Promise<PreferenciasReativacao> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('empresa_preferencias_ia')
    .select(`
      id_preferencia,
      maximo_tentativas_reativacoes_ia,
      maximo_tempo_reativacoes_por_inatividade,
      acao_apos_maximo_tentativas_reativacoes_ia,
      acao_apos_maximo_tempo_reativacoes_por_inatividade
    `)
    .eq('id_empresa', empresaId)
    .single();

  return (data as PreferenciasReativacao) ?? {
    maximo_tentativas_reativacoes_ia: 10,
    maximo_tempo_reativacoes_por_inatividade: 82800,
    acao_apos_maximo_tentativas_reativacoes_ia: 'TRANSFERIR',
    acao_apos_maximo_tempo_reativacoes_por_inatividade: 'TRANSFERIR',
  };
}

export async function getTagsEmpresa(empresaId: string): Promise<Tag[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('tags')
    .select('id_tag, nome, cor_hex')
    .eq('id_empresa', empresaId)
    .order('nome');

  return (data || []) as Tag[];
}

export async function getDepartamentosEmpresa(empresaId: string): Promise<Departamento[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('empresa_upchat_transferencias_departamentos')
    .select('id, departamento, descricao_conversa_para_ia, ativo')
    .eq('id_empresa', empresaId)
    .eq('ativo', true)
    .order('departamento');

  return (data || []) as Departamento[];
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
    .select(`
      id_regra,
      sequencia,
      tempo_espera_minutos,
      tipo_acao,
      mensagem_texto,
      ativo,
      id_tag,
      id_transferencia_departamento,
      tempo_inicio,
      tempo_fim
    `)
    .eq('id_empresa', empresaId)
    .order('sequencia', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as RegraReativacao[];
}
