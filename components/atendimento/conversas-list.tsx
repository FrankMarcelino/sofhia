'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, User, Bot, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversa {
  id_conversa: string;
  created_at: string;
  status_conversa: 'ia_conversando' | 'pausado' | 'encerrado' | 'aguardando_humano';
  data_ultima_interacao: string;
  pessoa: {
    id_pessoa: string;
    nome: string | null;
    telefone: string | null;
  } | null;
  agente: {
    id_agente: string;
    nome_agente: string;
  } | null;
}

interface ConversasListProps {
  conversas: Conversa[];
  conversaSelecionada?: string;
  onSelectConversa?: (id: string) => void;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  ia_conversando: { label: 'Ativa', variant: 'success' },
  pausado: { label: 'Pausada', variant: 'warning' },
  encerrado: { label: 'Encerrada', variant: 'info' },
  aguardando_humano: { label: 'Aguard. Humano', variant: 'error' },
};

type StatusFilter = 'todas' | 'ia_conversando' | 'aguardando_humano' | 'encerrado';

export function ConversasList({
  conversas,
  conversaSelecionada,
  onSelectConversa,
  className,
}: ConversasListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');

  // Filtrar conversas baseado em busca e status
  const conversasFiltradas = useMemo(() => {
    let resultado = conversas;

    // Filtrar por status
    if (statusFilter !== 'todas') {
      resultado = resultado.filter(c => c.status_conversa === statusFilter);
    }

    // Filtrar por busca (nome ou telefone)
    if (searchTerm.trim()) {
      const termoBusca = searchTerm.toLowerCase().trim();
      resultado = resultado.filter(c => {
        const nome = c.pessoa?.nome?.toLowerCase() || '';
        const telefone = c.pessoa?.telefone?.toLowerCase() || '';
        return nome.includes(termoBusca) || telefone.includes(termoBusca);
      });
    }

    return resultado;
  }, [conversas, statusFilter, searchTerm]);

  return (
    <Card className={cn('shadow-sm h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversas
          </CardTitle>
          <Badge variant="info">{conversasFiltradas.length}</Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={statusFilter === 'todas' ? 'outline' : 'ghost'}
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setStatusFilter('todas')}
          >
            <Filter className="h-3 w-3" />
            Todas
          </Button>
          <Button
            variant={statusFilter === 'ia_conversando' ? 'outline' : 'ghost'}
            size="sm"
            className="text-xs"
            onClick={() => setStatusFilter('ia_conversando')}
          >
            Ativas
          </Button>
          <Button
            variant={statusFilter === 'aguardando_humano' ? 'outline' : 'ghost'}
            size="sm"
            className="text-xs"
            onClick={() => setStatusFilter('aguardando_humano')}
          >
            Aguardando
          </Button>
          <Button
            variant={statusFilter === 'encerrado' ? 'outline' : 'ghost'}
            size="sm"
            className="text-xs"
            onClick={() => setStatusFilter('encerrado')}
          >
            Encerradas
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {conversasFiltradas.length === 0 ? (
          <div className="text-center py-12 px-6">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'todas'
                ? 'Nenhuma conversa encontrada com os filtros aplicados.'
                : 'Nenhuma conversa encontrada.'}
            </p>
            {(searchTerm || statusFilter !== 'todas') && (
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('todas');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversasFiltradas.map((conversa) => {
              const status = statusConfig[conversa.status_conversa] || statusConfig.conversando;
              const isSelected = conversaSelecionada === conversa.id_conversa;

              return (
                <button
                  key={conversa.id_conversa}
                  onClick={() => onSelectConversa?.(conversa.id_conversa)}
                  className={cn(
                    'w-full text-left p-4 hover:bg-muted/50 transition-colors',
                    isSelected && 'bg-primary/5 border-l-2 border-l-primary'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
                        conversa.status_conversa === 'ia_conversando'
                          ? 'bg-emerald-100'
                          : conversa.status_conversa === 'aguardando_humano'
                            ? 'bg-red-100'
                            : 'bg-muted'
                      )}>
                        <User className={cn(
                          'h-4 w-4',
                          conversa.status_conversa === 'ia_conversando'
                            ? 'text-emerald-600'
                            : conversa.status_conversa === 'aguardando_humano'
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conversa.pessoa?.nome || conversa.pessoa?.telefone || 'Cliente'}
                        </p>
                        {conversa.pessoa?.telefone && conversa.pessoa?.nome && (
                          <p className="text-xs text-muted-foreground truncate">
                            {conversa.pessoa.telefone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={status.variant} className="shrink-0 text-[10px]">
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {conversa.agente?.nome_agente || 'Sem agente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(conversa.data_ultima_interacao), {
                          addSuffix: false,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>

                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
