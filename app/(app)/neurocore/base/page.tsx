import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BaseContent } from '@/components/neurocore/base/base-content';
import {
  getDominios,
  getDocumentos,
  getCoberturas,
} from '@/lib/queries/neurocore';

async function getBaseData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar dados do usuário
  const { data: userData } = await supabase
    .from('usuarios_sofhia')
    .select('id, id_empresa')
    .eq('id', user.id)
    .single();

  const empresaId = userData?.id_empresa;

  if (!empresaId) {
    return {
      dominios: [],
      documentos: [],
      coberturas: [],
    };
  }

  // Buscar id_neurocore da empresa
  const { data: empresaData } = await supabase
    .from('empresa')
    .select('id_neurocore')
    .eq('id_empresa', empresaId)
    .single();

  const neurocoreId = empresaData?.id_neurocore;

  if (!neurocoreId) {
    return {
      dominios: [],
      documentos: [],
      coberturas: [],
      empresaId,
    };
  }

  // Buscar dados em paralelo
  const [dominios, documentos, coberturas] = await Promise.all([
    getDominios(neurocoreId),
    getDocumentos(empresaId),
    getCoberturas(empresaId),
  ]);

  return {
    dominios,
    documentos,
    coberturas,
    empresaId,
    neurocoreId,
  };
}

export default async function BasePage() {
  const { dominios, documentos, coberturas, empresaId } = await getBaseData();

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <section className="pb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Base de Conhecimento
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie domínios, documentos e áreas de cobertura que alimentam a inteligência do seu agente de IA.
        </p>
      </section>

      {/* Content with Tabs */}
      <BaseContent
        dominios={dominios}
        documentos={documentos}
        coberturas={coberturas || []}
        empresaId={empresaId || ''}
      />
    </div>
  );
}
