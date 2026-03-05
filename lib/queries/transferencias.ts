import { createClient } from '@/lib/supabase/server';
import { logSupabaseWarning } from '@/lib/utils';

export interface TransferenciaDepartamento {
  id: string;
  departamento: string;
  nome_setor_filtro: string | null;
  url_transferencia_filtro: string | null;
  tipo_transferencia_upchat: string;
  id_automacao_transferencia: number | null;
  url_transferencia_automacao: string | null;
  ativo: boolean;
  descricao_conversa_para_ia: string;
  registro_sistema: boolean;
}

export async function getTransferenciasDepartamentos(
  empresaId: string
): Promise<TransferenciaDepartamento[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('empresa_upchat_transferencias_departamentos')
    .select(`
      id,
      departamento,
      nome_setor_filtro,
      url_transferencia_filtro,
      tipo_transferencia_upchat,
      id_automacao_transferencia,
      url_transferencia_automacao,
      ativo,
      descricao_conversa_para_ia,
      registro_sistema
    `)
    .eq('id_empresa', empresaId)
    .order('departamento');

  if (error) {
    logSupabaseWarning(error, 'buscar transferências de departamentos');
    return [];
  }

  return (data || []) as TransferenciaDepartamento[];
}
