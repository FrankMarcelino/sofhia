'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MessageSquare, Bot, Cpu, Zap } from 'lucide-react';

interface SystemStatsProps {
  stats: {
    conversasAtivas: number;
    agentesAtivos: number;
    tokensHoje: number;
    requisicoesPorMinuto: number;
  };
  className?: string;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}

function StatItem({ icon, label, value, subtext }: StatItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export function SystemStats({ stats, className }: SystemStatsProps) {
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Estatísticas do Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={<MessageSquare className="h-5 w-5 text-primary" />}
            label="Conversas Ativas"
            value={stats.conversasAtivas}
            subtext="em andamento"
          />
          <StatItem
            icon={<Bot className="h-5 w-5 text-primary" />}
            label="Agentes Ativos"
            value={stats.agentesAtivos}
            subtext="configurados"
          />
          <StatItem
            icon={<Cpu className="h-5 w-5 text-primary" />}
            label="Tokens Hoje"
            value={formatTokens(stats.tokensHoje)}
            subtext="processados"
          />
          <StatItem
            icon={<Zap className="h-5 w-5 text-primary" />}
            label="Req/min"
            value={stats.requisicoesPorMinuto}
            subtext="média atual"
          />
        </div>
      </CardContent>
    </Card>
  );
}
