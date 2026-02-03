import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SimuladorChat } from '@/components/neurocore/simulador/simulador-chat';
import { getAgente } from '@/lib/queries/neurocore';

async function getSimuladorData() {
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
    return { agente: null };
  }

  // Buscar agente
  const agente = await getAgente(empresaId);

  return { agente };
}

export default async function SimuladorPage() {
  const { agente } = await getSimuladorData();

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <section className="pb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Simulador de IA
        </h1>
        <p className="text-sm text-muted-foreground">
          Teste seu agente em tempo real e veja custos, tokens e tempo de resposta.
        </p>
      </section>

      {/* Chat */}
      <SimuladorChat agente={agente} />
    </div>
  );
}
