'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, User, ExternalLink, Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Interacao {
  id_interacao: string;
  created_at: string;
  remetente: string;
  mensagem_texto: string | null;
  tipo_mensagem: string;
}

interface ChatViewerProps {
  interacoes: Interacao[];
  nomeCliente?: string;
  nomeAgente?: string;
  className?: string;
}

function MessageBubble({ interacao, nomeCliente, nomeAgente }: {
  interacao: Interacao;
  nomeCliente?: string;
  nomeAgente?: string;
}) {
  const isBot = interacao.remetente === 'assistant' || interacao.remetente === 'bot' || interacao.remetente === 'ia';
  const isHuman = interacao.remetente === 'humano' || interacao.remetente === 'atendente';
  const isClient = !isBot && !isHuman;

  const getSenderInfo = () => {
    if (isBot) return { name: nomeAgente || 'SOFHIA', icon: Bot, color: 'bg-primary text-white' };
    if (isHuman) return { name: 'Atendente', icon: User, color: 'bg-slate-600 text-white' };
    return { name: nomeCliente || 'Cliente', icon: User, color: 'bg-muted text-foreground' };
  };

  const sender = getSenderInfo();
  const Icon = sender.icon;

  return (
    <div className={cn(
      'flex gap-3 max-w-[85%]',
      isClient ? 'ml-auto flex-row-reverse' : ''
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
        sender.color
      )}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Message */}
      <div className={cn(
        'flex flex-col',
        isClient ? 'items-end' : 'items-start'
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {sender.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(interacao.created_at), 'HH:mm', { locale: ptBR })}
          </span>
        </div>
        <div className={cn(
          'rounded-2xl px-4 py-2 max-w-full',
          isBot
            ? 'bg-primary/10 text-foreground rounded-tl-none'
            : isHuman
              ? 'bg-slate-100 text-foreground rounded-tl-none'
              : 'bg-muted text-foreground rounded-tr-none'
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {interacao.mensagem_texto || '[Mídia não suportada]'}
          </p>
          {interacao.tipo_mensagem !== 'text' && (
            <Badge variant="info" className="mt-2 text-[10px]">
              {interacao.tipo_mensagem}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatViewer({
  interacoes,
  nomeCliente,
  nomeAgente,
  className,
}: ChatViewerProps) {
  if (interacoes.length === 0) {
    return (
      <Card className={cn('shadow-sm h-full flex flex-col', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Visualizador de Conversa
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Selecione uma conversa para visualizar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Agrupar mensagens por dia
  const messagesByDay = interacoes.reduce((acc, interacao) => {
    const day = format(new Date(interacao.created_at), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(interacao);
    return acc;
  }, {} as Record<string, Interacao[]>);

  return (
    <Card className={cn('shadow-sm h-full flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {nomeCliente || 'Conversa'}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {interacoes.length} mensagens
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" className="gap-1">
            <Eye className="h-3 w-3" />
            Modo Espectador
          </Badge>
          <Button variant="outline" size="sm" className="gap-1">
            <ExternalLink className="h-4 w-4" />
            Abrir no UpChat
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto bg-slate-50/50 rounded-lg mx-6 mb-6 p-4">
        <div className="space-y-6">
          {Object.entries(messagesByDay).map(([day, messages]) => (
            <div key={day}>
              {/* Date separator */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(day), "d 'de' MMMM", { locale: ptBR })}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {messages.map((interacao) => (
                  <MessageBubble
                    key={interacao.id_interacao}
                    interacao={interacao}
                    nomeCliente={nomeCliente}
                    nomeAgente={nomeAgente}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Spectator Mode Bar */}
      <div className="mx-6 mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center gap-2">
        <Eye className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-amber-700 font-medium">
          Modo Espectador — Somente leitura
        </span>
      </div>
    </Card>
  );
}
