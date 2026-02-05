import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DominiosList } from '@/components/neurocore/base/dominios-list';
import { DocumentosList } from '@/components/neurocore/base/documentos-list';
import {
  getDominios,
  getDocumentos,
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
      empresaId,
    };
  }

  // Buscar dados em paralelo
  const [dominios, documentos] = await Promise.all([
    getDominios(neurocoreId),
    getDocumentos(empresaId),
  ]);

  return {
    dominios,
    documentos,
    empresaId,
    neurocoreId,
  };
}

export default async function BasePage() {
  const { dominios, documentos, empresaId } = await getBaseData();

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <section className="pb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Base de Conhecimento
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie domínios e documentos que alimentam a inteligência do seu agente de IA.
        </p>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Domínios */}
        <div className="col-span-4">
          <DominiosList dominios={dominios} />
        </div>

        {/* Right: Documentos */}
        <div className="col-span-8">
          <DocumentosList
            documentos={documentos}
            dominios={dominios}
            empresaId={empresaId}
          />
        </div>
      </div>
    </div>
  );
}
