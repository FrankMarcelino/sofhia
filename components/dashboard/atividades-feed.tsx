import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, DollarSign, Bot, Activity, User, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface AtividadesFeedProps {
  atividades: Array<{
    id: string;
    tipo: 'conversa' | 'venda' | 'agente' | 'sistema';
    titulo: string;
    descricao: string;
    timestamp: string;
    status: 'success' | 'error' | 'info' | 'warning';
    valor?: number;
    avatar?: string;
    isBot?: boolean;
  }>;
  showViewAll?: boolean;
}

const ICONS = {
  conversa: MessageSquare,
  venda: DollarSign,
  agente: Bot,
  sistema: Activity,
};

const ICON_GRADIENTS = {
  success: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  error: 'bg-gradient-to-br from-red-400 to-red-600',
  info: 'bg-gradient-to-br from-blue-400 to-blue-600',
  warning: 'bg-gradient-to-br from-amber-400 to-amber-600',
};

const STATUS_BADGES = {
  success: { variant: 'success' as const, label: 'Negotiating' },
  error: { variant: 'error' as const, label: 'Failed' },
  info: { variant: 'info' as const, label: 'Qualified' },
  warning: { variant: 'warning' as const, label: 'Interested' },
};

export function AtividadesFeed({ atividades, showViewAll = true }: AtividadesFeedProps) {
  if (atividades.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <CardTitle className="text-lg font-bold">Live Sales Feed</CardTitle>
          </div>
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
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <CardTitle className="text-lg font-bold">Live Sales Feed</CardTitle>
        </div>
        {showViewAll && (
          <Link 
            href="/atividades" 
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {atividades.map((atividade) => {
            const Icon = ICONS[atividade.tipo];
            const badgeConfig = STATUS_BADGES[atividade.status];

            return (
              <div 
                key={atividade.id} 
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  <AvatarFallback className={cn(
                    'text-white font-semibold text-sm',
                    ICON_GRADIENTS[atividade.status]
                  )}>
                    {atividade.isBot ? (
                      <Bot className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {atividade.titulo}
                    </p>
                    {atividade.valor !== undefined && (
                      <span className="text-sm font-bold text-foreground whitespace-nowrap">
                        R$ {atividade.valor.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">
                      {atividade.descricao}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={badgeConfig.variant} className="text-[10px] px-1.5 py-0">
                      {badgeConfig.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(atividade.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>

                {/* More Options */}
                <button className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

