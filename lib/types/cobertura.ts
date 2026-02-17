export interface Cobertura {
  id: string;
  id_empresa: string;
  cep: string | null;
  cep_inicio: string | null;
  cep_fim: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  logradouro: string | null;
  numero_inicio: string | null;
  numero_fim: string | null;
  observacoes: string | null;
  status_disponibilidade: boolean;
  created_at: string;
}

export type TipoCobertura = 'faixa_cep' | 'logradouro' | 'bairro' | 'cidade' | 'estado';

export function inferirTipoCobertura(c: Cobertura): TipoCobertura {
  if (c.cep_inicio || c.cep_fim) return 'faixa_cep';
  if (c.logradouro) return 'logradouro';
  if (c.bairro) return 'bairro';
  if (c.cidade) return 'cidade';
  if (c.estado) return 'estado';
  return 'bairro';
}

export const TIPOS_COBERTURA_LABEL: Record<TipoCobertura, string> = {
  faixa_cep: 'Faixa de CEP',
  logradouro: 'Logradouro',
  bairro: 'Bairro',
  cidade: 'Cidade',
  estado: 'Estado',
};
