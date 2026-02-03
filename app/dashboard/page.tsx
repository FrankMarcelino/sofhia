import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  MessageSquare, 
  Users, 
  Bot,
  DollarSign,
  Download,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/dashboard/kpi-card';
import { VendasChart } from '@/components/dashboard/vendas-chart';
import { FunilChart } from '@/components/dashboard/funil-chart';
import { SalesFunnel } from '@/components/dashboard/sales-funnel';
import { TopAgents } from '@/components/dashboard/top-agents';
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

  // Transformar funil para o novo componente SalesFunnel
  const funnelStages = funil.map((item) => ({
    label: item.etapa,
    value: item.quantidade,
    percentage: item.percentual,
  }));

  // Mock data para Top Agents (substituir com dados reais depois)
  const topAgents = [
    { id: '1', nome: 'Sophie Bot', taxaConversao: 98, totalConversas: 24 },
    { id: '2', nome: 'Agent Alpha', taxaConversao: 94, totalConversas: 18 },
    { id: '3', nome: 'Hunter AI', taxaConversao: 91, totalConversas: 15 },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Welcome back, {user?.nome?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in your <span className="font-semibold">{empresa?.nome_fantasia || 'company'}</span> today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            Last 7 Days
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      {kpis ? (
        <div className="grid grid-cols-4 gap-6">
          <KPICard
            title="Conversas Ativas"
            value={kpis.conversasAtivas}
            subtitle={
              kpis.conversasAtivas === 0
                ? 'Nenhuma conversa no momento'
                : 'Aguardando atendimento'
            }
            icon={MessageSquare}
            iconColor="info"
            trend={{ value: 12.5, isPositive: true }}
          />

          <KPICard
            title="Today's Sales"
            value={formatCurrency(kpis.saldo / 10)}
            subtitle="Total vendido hoje"
            icon={DollarSign}
            iconColor="success"
            trend={{ value: 8.3, isPositive: true }}
          />

          <KPICard
            title="Leads Generated"
            value={kpis.clientesAtivos}
            subtitle="Novos leads este mês"
            icon={Users}
            iconColor="warning"
            trend={{ value: 15.2, isPositive: true }}
          />

          <KPICard
            title="AI Agent Conv."
            value={`${kpis.taxaConversao.toFixed(0)}%`}
            subtitle="Taxa de conversão IA"
            icon={Bot}
            iconColor="primary"
            trend={{ value: 5.1, isPositive: true }}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
      )}

      {/* Main Content Grid - 2 Columns Layout */}
      <div className="grid grid-cols-5 gap-8">
        {/* Left Column - Sales Funnel (2/5 width) */}
        <div className="col-span-2">
          <SalesFunnel stages={funnelStages} />
        </div>

        {/* Right Column - Live Sales Feed (3/5 width) */}
        <div className="col-span-3">
          <AtividadesFeed 
            atividades={atividades.map((a, i) => ({
              ...a,
              valor: i % 2 === 0 ? 12000 + (i * 5000) : undefined,
              isBot: i % 3 !== 0,
            }))} 
            showViewAll={true}
          />
        </div>
      </div>

      {/* Charts Grid - Below main content */}
      <div className="grid grid-cols-2 gap-8">
        <VendasChart data={vendasTrend} />
        <FunilChart data={funil} />
      </div>

      {/* Top Performing Agents */}
      <TopAgents agents={topAgents} />
    </div>
  );
}
