import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, DollarSign, Bot, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AtividadesFeedProps {
  atividades: Array<{
    id: string;
    tipo: 'conversa' | 'venda' | 'agente' | 'sistema';
    titulo: string;
    descricao: string;
    timestamp: string;
    status: 'success' | 'error' | 'info' | 'warning';
  }>;
}

const ICONS = {
  conversa: MessageSquare,
  venda: DollarSign,
  agente: Bot,
  sistema: Activity,
};

const STATUS_COLORS = {
  success: 'text-success',
  error: 'text-destructive',
  info: 'text-info',
  warning: 'text-warning',
};

export function AtividadesFeed({ atividades }: AtividadesFeedProps) {
  if (atividades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma atividade recente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {atividades.map((atividade) => {
            const Icon = ICONS[atividade.tipo];
            const colorClass = STATUS_COLORS[atividade.status];

            return (
              <div key={atividade.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted',
                    colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {atividade.titulo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {atividade.descricao}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(atividade.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
