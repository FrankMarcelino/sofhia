'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, CreditCard } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface ResumoFinanceiroProps {
  consumo30d: number;
  consumo7d: number;
  mediadiaria: number;
  recargasMes: number;
  className?: string;
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricItem({ icon, label, value, subtext, trend }: MetricItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-foreground">{value}</p>
          {trend && trend !== 'neutral' && (
            <span className={cn(
              'flex items-center text-xs font-medium',
              trend === 'up' ? 'text-red-600' : 'text-emerald-600'
            )}>
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              )}
            </span>
          )}
        </div>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

export function ResumoFinanceiro({
  consumo30d,
  consumo7d,
  mediadiaria,
  recargasMes,
  className,
}: ResumoFinanceiroProps) {
  // Calcular tendência: se consumo dos últimos 7 dias está acima da média
  const mediaSemanal = consumo30d / 4;
  const tendencia = consumo7d > mediaSemanal * 1.1 ? 'up' : consumo7d < mediaSemanal * 0.9 ? 'down' : 'neutral';

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Resumo do Período</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <MetricItem
            icon={<Calendar className="h-5 w-5 text-primary" />}
            label="Consumo (30 dias)"
            value={formatCurrency(consumo30d)}
            subtext="Total do mês"
          />
          <MetricItem
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="Consumo (7 dias)"
            value={formatCurrency(consumo7d)}
            subtext="Última semana"
            trend={tendencia}
          />
          <MetricItem
            icon={<TrendingDown className="h-5 w-5 text-primary" />}
            label="Média Diária"
            value={formatCurrency(mediadiaria)}
            subtext="Baseado em 30 dias"
          />
          <MetricItem
            icon={<CreditCard className="h-5 w-5 text-primary" />}
            label="Recargas do Mês"
            value={formatCurrency(recargasMes)}
            subtext="Créditos adicionados"
          />
        </div>
      </CardContent>
    </Card>
  );
}
