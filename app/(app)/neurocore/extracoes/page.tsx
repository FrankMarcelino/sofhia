import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Braces } from 'lucide-react';
import { ExtracoesContent } from '@/components/neurocore/extracoes/extracoes-content';
import { getAgentes, getExtracoes } from '@/lib/queries/neurocore';

async function getExtracoesData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: userData } = await supabase
    .from('usuarios_sofhia')
    .select('id, id_empresa')
    .eq('id', user.id)
    .single();

  const empresaId = userData?.id_empresa;
  if (!empresaId) return { agentes: [], extracoesByAgente: {} };

  const agentes = await getAgentes(empresaId);

  const extracoesByAgente: Record<string, Awaited<ReturnType<typeof getExtracoes>>> = {};

  if (agentes.length > 0) {
    const results = await Promise.all(
      agentes.map(async (a) => ({
        id: a.id_agente,
        extracoes: await getExtracoes(a.id_agente),
      }))
    );
    results.forEach(({ id, extracoes }) => {
      extracoesByAgente[id] = extracoes;
    });
  }

  return { agentes, extracoesByAgente };
}

export default async function ExtracoesPage() {
  const { agentes, extracoesByAgente } = await getExtracoesData();

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <section className="pb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
          <Braces className="h-7 w-7" />
          Extrações
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os campos que os agentes de IA coletam durante as conversas.
        </p>
      </section>

      <ExtracoesContent agentes={agentes} extracoesByAgente={extracoesByAgente} />
    </div>
  );
}
