'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Zap, QrCode } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface RecargaOptionsProps {
  className?: string;
}

const VALORES_PREDEFINIDOS = [50, 100, 200, 500];

export function RecargaOptions({ className }: RecargaOptionsProps) {
  const [valorSelecionado, setValorSelecionado] = useState<number | null>(null);
  const [valorCustom, setValorCustom] = useState<string>('');

  const valorFinal = valorSelecionado || (valorCustom ? parseFloat(valorCustom) : 0);

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Adicionar Créditos
        </CardTitle>
        <CardDescription>
          Selecione um valor ou insira um valor personalizado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Valores Predefinidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {VALORES_PREDEFINIDOS.map((valor) => (
            <button
              key={valor}
              onClick={() => {
                setValorSelecionado(valor);
                setValorCustom('');
              }}
              className={cn(
                'relative px-2 py-3 sm:px-3 sm:py-4 rounded-lg border-2 transition-all duration-200 min-h-[56px] flex items-center justify-center',
                valorSelecionado === valor
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <p className="text-sm sm:text-base font-semibold text-foreground whitespace-nowrap">
                {formatCurrency(valor)}
              </p>
              {valor === 200 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  Popular
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Valor Personalizado */}
        <div className="space-y-2">
          <Label htmlFor="valor_custom">Ou insira um valor personalizado</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              id="valor_custom"
              type="number"
              min={10}
              step={10}
              value={valorCustom}
              onChange={(e) => {
                setValorCustom(e.target.value);
                setValorSelecionado(null);
              }}
              placeholder="0,00"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Valor mínimo: R$ 10,00</p>
        </div>

        {/* Resumo */}
        {valorFinal > 0 && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor selecionado</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(valorFinal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Taxa de processamento</span>
              <span className="text-emerald-600 font-medium">Grátis</span>
            </div>
          </div>
        )}

        {/* Métodos de Pagamento */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Método de Pagamento</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-2"
              disabled={valorFinal <= 0}
            >
              <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-xs sm:text-sm font-medium">PIX</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Instantâneo</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 sm:py-4 flex-col gap-1 sm:gap-2"
              disabled={valorFinal <= 0}
            >
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-xs sm:text-sm font-medium">Cartão</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Crédito/Débito</span>
            </Button>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full gap-2"
          size="lg"
          disabled={valorFinal <= 0}
        >
          <Zap className="h-5 w-5" />
          {valorFinal > 0
            ? `Recarregar ${formatCurrency(valorFinal)}`
            : 'Selecione um valor'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Pagamentos processados de forma segura. Os créditos são liberados instantaneamente após a confirmação.
        </p>
      </CardContent>
    </Card>
  );
}
