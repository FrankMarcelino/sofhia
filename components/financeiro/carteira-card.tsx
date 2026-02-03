'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertTriangle, TrendingDown, Plus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface CarteiraCardProps {
  saldo: number;
  alertaSaldoBaixo: number;
  diasRestantes: number;
  className?: string;
}

export function CarteiraCard({
  saldo,
  alertaSaldoBaixo,
  diasRestantes,
  className,
}: CarteiraCardProps) {
  const saldoBaixo = saldo < alertaSaldoBaixo;
  const saldoCritico = saldo < alertaSaldoBaixo / 2;

  return (
    <Card className={cn(
      'shadow-sm overflow-hidden',
      saldoCritico && 'border-red-300 bg-red-50/50',
      saldoBaixo && !saldoCritico && 'border-amber-300 bg-amber-50/50',
      className
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              saldoCritico
                ? 'bg-red-100'
                : saldoBaixo
                  ? 'bg-amber-100'
                  : 'bg-primary/10'
            )}>
              <Wallet className={cn(
                'h-6 w-6',
                saldoCritico
                  ? 'text-red-600'
                  : saldoBaixo
                    ? 'text-amber-600'
                    : 'text-primary'
              )} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Disponível</p>
              <p className={cn(
                'text-3xl font-bold',
                saldoCritico
                  ? 'text-red-700'
                  : saldoBaixo
                    ? 'text-amber-700'
                    : 'text-foreground'
              )}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>

          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Recarregar
          </Button>
        </div>

        {/* Alertas */}
        {saldoCritico && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 text-red-700 mb-4">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Saldo Crítico</p>
              <p className="text-xs">Seu saldo está muito baixo. Recarregue para continuar operando.</p>
            </div>
          </div>
        )}

        {saldoBaixo && !saldoCritico && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 text-amber-700 mb-4">
            <TrendingDown className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Saldo Baixo</p>
              <p className="text-xs">Considere recarregar em breve para evitar interrupções.</p>
            </div>
          </div>
        )}

        {/* Info Row */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">Previsão: </span>
            <span className="font-semibold">
              {diasRestantes > 0 ? `~${diasRestantes} dias` : 'Menos de 1 dia'}
            </span>
          </div>
          <Badge variant={saldoCritico ? 'error' : saldoBaixo ? 'warning' : 'success'}>
            {saldoCritico ? 'Crítico' : saldoBaixo ? 'Baixo' : 'Normal'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
