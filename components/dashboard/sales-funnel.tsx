import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

interface SalesFunnelProps {
  stages: FunnelStage[];
  className?: string;
}

const stageColors = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-primary',
];

export function SalesFunnel({ stages, className }: SalesFunnelProps) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Sales Funnel</CardTitle>
        <div className="text-sm text-muted-foreground">
          Últimos 30 dias
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    stageColors[index % stageColors.length]
                  )} />
                  <span className="text-sm font-medium text-foreground">
                    {stage.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">
                    {stage.value}
                  </span>
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    stage.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                    stage.percentage >= 50 ? 'bg-blue-100 text-blue-700' :
                    stage.percentage >= 25 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={stage.percentage} 
                className="h-2"
              />
            </div>
          ))}
        </div>
        
        {stages.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Conversão Total</span>
              <span className="font-bold text-primary">
                {stages.length > 0 
                  ? ((stages[stages.length - 1].value / stages[0].value) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
