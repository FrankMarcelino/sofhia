import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ConversasList } from '@/components/atendimento/conversas-list';
import { ChatViewer } from '@/components/atendimento/chat-viewer';
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
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <section className="pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Atendimento
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe e audite as conversas dos seus clientes em modo espectador.
        </p>
      </section>

      {/* Stats Cards */}
      <section className="pb-6">
        <StatsCards stats={stats} />
      </section>

      {/* Main Grid - Split View */}
      <section className="grid grid-cols-5 gap-6" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
        {/* Left Column - Conversas List (2/5 width) */}
        <div className="col-span-2">
          <ConversasList
            conversas={conversas}
            className="h-full"
          />
        </div>

        {/* Right Column - Chat Viewer (3/5 width) */}
        <div className="col-span-3">
          <ChatViewer
            interacoes={[]}
            className="h-full"
          />
        </div>
      </section>
    </div>
  );
}
