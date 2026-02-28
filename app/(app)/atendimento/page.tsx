import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AtendimentoWrapper } from '@/components/atendimento/atendimento-wrapper';
import { StatsCards } from '@/components/atendimento/stats-cards';
import {
  getConversas,
  getEstatisticasConversas,
} from '@/lib/queries/atendimento';

async function getAtendimentoData() {
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
      conversas: [],
      stats: {
        ativas: 0,
        hoje: 0,
        aguardandoHumano: 0,
        encerradasHoje: 0,
      },
    };
  }

  // Buscar dados em paralelo
  const [conversas, stats] = await Promise.all([
    getConversas(empresaId),
    getEstatisticasConversas(empresaId),
  ]);

  return {
    conversas,
    stats,
  };
}

export default async function AtendimentoPage() {
  const { conversas, stats } = await getAtendimentoData();

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <section className="pb-6 shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Atendimento
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe e audite as conversas dos seus clientes em modo espectador.
        </p>
      </section>

      {/* Stats Cards */}
      <section className="pb-6 shrink-0">
        <StatsCards stats={stats} />
      </section>

      {/* Main Grid - ocupa o restante da altura */}
      <div className="flex-1 min-h-0">
        <AtendimentoWrapper conversas={conversas} />
      </div>
    </div>
  );
}
