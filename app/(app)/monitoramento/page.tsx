import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Wifi, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HealthCard } from '@/components/monitoring/health-card';
import { ConnectionInfo } from '@/components/monitoring/connection-info';
import { ConnectionLogs } from '@/components/monitoring/connection-logs';
import { SystemStats } from '@/components/monitoring/system-stats';
import {
  getUpChatConfig,
  checkUpChatHealth,
  getSystemStats
} from '@/lib/queries/monitoring';
import Link from 'next/link';

async function getMonitoringData() {
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
      config: null,
      health: {
        api: 'offline' as const,
        token: 'invalid' as const,
        user: 'inactive' as const,
        lastCheck: new Date().toISOString(),
      },
      stats: {
        conversasAtivas: 0,
        agentesAtivos: 0,
        tokensHoje: 0,
        requisicoesPorMinuto: 0,
      },
    };
  }

  // Buscar configurações e status
  const [config, stats] = await Promise.all([
    getUpChatConfig(empresaId),
    getSystemStats(empresaId),
  ]);

  const health = await checkUpChatHealth(config);

  return {
    config,
    health,
    stats,
  };
}

export default async function MonitoramentoPage() {
  const { config, health, stats } = await getMonitoringData();

  const lastCheckFormatted = new Date(health.lastCheck).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <section className="flex items-start justify-between gap-6 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Monitoramento
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status da integração com o UpChat e a saúde do sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Última verificação: {lastCheckFormatted}
          </span>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Verificar Agora
          </Button>
          <Link href="/parametros">
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Settings className="h-4 w-4" />
              Configurar
            </Button>
          </Link>
        </div>
      </section>

      {/* Health Status Cards */}
      <section className="grid grid-cols-3 gap-6 pb-10">
        <HealthCard
          title="API UpChat"
          status={health.api}
          description={health.api === 'online' ? 'Conexão estável' : 'Sem conexão'}
          icon="wifi"
        />
        <HealthCard
          title="Token de Acesso"
          status={health.token}
          description={health.token === 'valid' ? 'Autenticado' : 'Token não configurado'}
          icon="key"
        />
        <HealthCard
          title="Usuário SOFHIA"
          status={health.user}
          description={health.user === 'active' ? 'Operacional' : 'Não configurado'}
          icon="user"
        />
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-5 gap-8 pb-10">
        {/* Left Column - Connection Info + Stats (2/5 width) */}
        <div className="col-span-2 space-y-6">
          <ConnectionInfo config={config} />
          <SystemStats stats={stats} />
        </div>

        {/* Right Column - Logs (3/5 width) */}
        <div className="col-span-3">
          <ConnectionLogs />
        </div>
      </section>

      {/* Alert Banner - Only show if offline */}
      {health.api === 'offline' && (
        <section className="pb-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800">Conexão Indisponível</p>
                <p className="text-sm text-red-600">
                  Não foi possível estabelecer conexão com o UpChat. Verifique as configurações.
                </p>
              </div>
            </div>
            <Link href="/parametros">
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                Verificar Configurações
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
