'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, ArrowUpCircle, ArrowDownCircle, ExternalLink } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Movimentacao {
  id_movimentacao: string;
  created_at: string;
  tipo_operacao: 'CREDITO' | 'DEBITO';
  valor: number;
  saldo_apos: number;
  descricao: string | null;
  id_uso_referencia: number | null;
}

interface ExtratoProps {
  movimentacoes: Movimentacao[];
  className?: string;
}

export function Extrato({ movimentacoes, className }: ExtratoProps) {
  if (movimentacoes.length === 0) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Extrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma movimentação registrada.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Extrato
        </CardTitle>
        <Button variant="outline" size="sm">
          Ver Completo
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {movimentacoes.map((mov) => (
            <div
              key={mov.id_movimentacao}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Icon & Info */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  mov.tipo_operacao === 'CREDITO'
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
                )}>
                  {mov.tipo_operacao === 'CREDITO' ? (
                    <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {mov.descricao || (mov.tipo_operacao === 'CREDITO' ? 'Recarga' : 'Consumo IA')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(mov.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {/* Value & Balance */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-bold',
                    mov.tipo_operacao === 'CREDITO' ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {mov.tipo_operacao === 'CREDITO' ? '+' : '-'}{formatCurrency(mov.valor)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Saldo: {formatCurrency(mov.saldo_apos)}
                  </p>
                </div>
                {mov.id_uso_referencia && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
