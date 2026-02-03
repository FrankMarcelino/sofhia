/**
 * Global Types and Interfaces for SOFHIA Enterprise
 */

// User and Authentication
export interface User {
  id: string;
  email: string;
  nome_usuario: string | null;
  id_empresa: string;
  ativo: boolean;
  created_at: string;
}

// Company/Empresa
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
  created_at: string;
  updated_at: string;
}

// Dashboard KPIs
export interface DashboardKPIs {
  vendas_hoje: number;
  conversas_ativas: number;
  leads_gerados: number;
  taxa_conversao: number;
}

// Sales Trend Data
export interface SalesTrendData {
  date: string;
  value: number;
}

// Funnel Stage
export interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
}

// Recent Sale
export interface RecentSale {
  id_venda: string;
  cliente_nome: string;
  servico: string;
  valor: number;
  data: string;
  status: string;
}

// Wallet/Carteira
export interface Carteira {
  id_carteira: string;
  id_empresa: string;
  saldo_creditos: number;
  limite_cheque_especial: number;
  alerta_saldo_baixo: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Wallet Transaction
export interface CarteiraMovimentacao {
  id_movimentacao: string;
  id_carteira: string;
  id_empresa: string;
  tipo_operacao: 'CREDITO' | 'DEBITO';
  valor: number;
  saldo_apos: number;
  descricao: string | null;
  created_at: string;
}

// Agent Instruction
export interface AgenteInstrucao {
  id: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  ordem: number;
}

// Agent/Agente
export interface Agente {
  id_agente: string;
  id_empresa: string;
  nome_agente: string;
  persona: string;
  tom_voz: string;
  objetivo: string;
  instrucoes: AgenteInstrucao[]; // JSONB
  ativo: boolean;
  id_modelo_ia: string;
  created_at: string;
  updated_at: string;
}

// Conversation/Conversa
export interface Conversa {
  id_conversa: string;
  id_empresa: string;
  id_pessoa: string;
  id_agente_atendente: string | null;
  status_conversa: 'conversando' | 'pausado' | 'encerrado' | 'aguardando_humano';
  motivo_da_conversa: string;
  encerrada: boolean;
  created_at: string;
  updated_at: string;
  data_ultima_interacao: string;
}

// Interaction/Mensagem
export interface Interacao {
  id_interacao: string;
  id_conversa: string;
  remetente: 'cliente' | 'ia' | 'humano';
  mensagem_texto: string | null;
  tipo_mensagem: 'text' | 'audio' | 'image' | 'document';
  created_at: string;
}

// Person/Lead
export interface Pessoa {
  id_pessoa: string;
  id_empresa: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  cnpj: string | null;
  cidade: string | null;
  created_at: string;
  updated_at: string;
}

// Qualified Data
export interface PessoaDadoQualificacao {
  id_dado: string;
  id_pessoa: string;
  id_conversa: string | null;
  chave: string;
  valor: string | null;
  confianca_ia: number;
  origem_dado: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
