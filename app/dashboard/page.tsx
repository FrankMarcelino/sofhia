import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Bot,
  TrendingUp,
  DollarSign 
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { VendasChart } from '@/components/dashboard/vendas-chart';
import { FunilChart } from '@/components/dashboard/funil-chart';
import { AtividadesFeed } from '@/components/dashboard/atividades-feed';
import {
  getDashboardKPIs,
  getVendasTrend,
  getFunilVendas,
  getAtividadesRecentes,
} from '@/lib/queries/dashboard';
import { formatCurrency } from '@/lib/utils';

async function getDashboardData() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Buscar dados do usuário e empresa
  const { data: userData } = await supabase
    .from('usuarios')
    .select('*, empresa:empresas(*)')
    .eq('id', user.id)
    .single();

  const empresaId = userData?.id_empresa;

  if (!empresaId) {
    return {
      user: userData,
      empresa: userData?.empresa,
      kpis: null,
      vendasTrend: [],
      funil: [],
      atividades: [],
    };
  }

  // Buscar dados do dashboard em paralelo
  const [kpis, vendasTrend, funil, atividades] = await Promise.all([
    getDashboardKPIs(empresaId),
    getVendasTrend(empresaId),
    getFunilVendas(empresaId),
    getAtividadesRecentes(empresaId, 10),
  ]);

  return {
    user: userData,
    empresa: userData?.empresa,
    kpis,
    vendasTrend,
    funil,
    atividades,
  };
}

export default async function DashboardPage() {
  const { user, empresa, kpis, vendasTrend, funil, atividades } =
    await getDashboardData();

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Bem-vindo, {user?.nome?.split(' ')[0]}! 👋
        </h2>
        <p className="text-muted-foreground">
          {empresa?.nome_fantasia || 'Sua empresa'}
        </p>
      </div>

      {/* KPIs Grid */}
      {kpis ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <KPICard
            title="Conversas Ativas"
            value={kpis.conversasAtivas}
            subtitle={
              kpis.conversasAtivas === 0
                ? 'Nenhuma conversa no momento'
                : 'Aguardando atendimento'
            }
            icon={MessageSquare}
          />

          <KPICard
            title="Clientes Ativos"
            value={kpis.clientesAtivos}
            subtitle={
              kpis.clientesAtivos === 0
                ? 'Cadastre seus primeiros clientes'
                : 'Total de clientes cadastrados'
            }
            icon={Users}
          />

          <KPICard
            title="Agentes IA"
            value={kpis.agentesAtivos}
            subtitle={
              kpis.agentesAtivos === 0
                ? 'Configure seu primeiro agente'
                : 'Agentes ativos no sistema'
            }
            icon={Bot}
          />

          <KPICard
            title="Taxa de Conversão"
            value={`${kpis.taxaConversao.toFixed(1)}%`}
            subtitle="Últimos 30 dias"
            icon={TrendingUp}
          />

          <KPICard
            title="Saldo Atual"
            value={formatCurrency(kpis.saldo)}
            subtitle={
              kpis.saldo === 0
                ? 'Faça sua primeira recarga'
                : 'Disponível para uso'
            }
            icon={DollarSign}
          />

          <KPICard
            title="Status Sistema"
            value={
              kpis.statusSistema === 'online'
                ? 'Online'
                : kpis.statusSistema === 'offline'
                ? 'Offline'
                : 'Manutenção'
            }
            subtitle={
              kpis.statusSistema === 'online'
                ? 'Todos os serviços operacionais'
                : 'Serviços indisponíveis'
            }
            icon={LayoutDashboard}
            className={
              kpis.statusSistema === 'online' ? 'text-success' : 'text-destructive'
            }
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <VendasChart data={vendasTrend} />
        <FunilChart data={funil} />
      </div>

      {/* Atividades Recentes */}
      <AtividadesFeed atividades={atividades} />
    </div>
  );
}
