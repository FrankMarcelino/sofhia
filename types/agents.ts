// Types for Agent Editor Feature
// Estrutura baseada na Livia

// Estrutura de sub-instrução (item dentro de um GuidelineStep)
export interface GuidelineSubInstruction {
  content: string;
  active: boolean;
}

// Estrutura principal de um item de guideline/instrução/limitação/etc
export interface GuidelineStep {
  title: string;
  type: 'rank' | 'markdown'; // rank = numerado, markdown = formatado
  active: boolean;
  sub: GuidelineSubInstruction[];
}

// Agente com todos os campos
export interface Agente {
  id_agente: string;
  created_at: string;
  updated_at: string;
  id_empresa: string;
  id_neurocore: string;
  id_tipo_agente: string;
  nome_agente: string;
  persona: string;
  tom_voz: string;
  objetivo: string;
  instrucoes: GuidelineStep[] | string[] | null;
  limitacoes: GuidelineStep[] | string[] | null;
  roteiro: GuidelineStep[] | string[] | null;
  rules: GuidelineStep[] | null;
  others_instructions: GuidelineStep[] | null;
  meio_comunicacao: string | null;
  ativo: boolean;
  nome_agente_identificador: string | null;
  sexo_agente: string | null;
  id_modelo_ia: string;
  grupo_teste_ab: string | null;
  peso_distribuicao: number;
}

// Dados do formulário de edição do agente
export interface AgentFormData {
  // Personalidade
  nome_agente: string;
  nome_agente_identificador: string | null;
  persona: string;
  tom_voz: string;
  objetivo: string;
  sexo_agente: string;
  meio_comunicacao: string;
  id_modelo_ia: string;
  ativo: boolean;

  // Campos JSONB (todos usam GuidelineStep[])
  limitacoes: GuidelineStep[] | null;
  instrucoes: GuidelineStep[] | null;
  roteiro: GuidelineStep[] | null;
  rules: GuidelineStep[] | null;
  others_instructions: GuidelineStep[] | null;
}

// Modelo de IA
export interface ModeloIA {
  id_modelo: string;
  nome_exibicao: string;
  provedor: string;
  custo_input_por_1m: number;
  custo_output_por_1m: number;
  context_window: number | null;
  ativo: boolean;
}

// Extração de dados
export interface Extracao {
  id_agente_extracoes: string;
  created_at: string;
  id_agente: string;
  informacao_para_extrair: string;
  descricao_para_ia: string;
  tipo_dado: 'string' | 'number' | 'boolean' | 'date' | 'json';
  tipo_chave_normatizada: string | null;
}

// Labels para tipos
export const GENDER_OPTIONS = [
  { value: 'neutro', label: 'Neutro' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
] as const;

export const COMMUNICATION_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'webchat', label: 'WebChat' },
] as const;
