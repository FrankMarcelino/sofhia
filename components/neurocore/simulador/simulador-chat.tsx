'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bot, User, Send, Loader2, DollarSign, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agente } from '@/lib/queries/neurocore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    tokensUsados?: number;
    tokensInput?: number;
    tokensOutput?: number;
    custoTotal?: number;
    tempoResposta?: number;
    modelo?: string;
    documentosUsados?: number;
  };
}

interface SimuladorChatProps {
  agente: Agente | null;
}

export function SimuladorChat({ agente }: SimuladorChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalCusto, setTotalCusto] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !agente) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: inputValue,
          agenteId: agente.id_agente,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na resposta da API');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.resposta,
        timestamp: new Date(),
        metadata: {
          tokensUsados: data.tokensUsados,
          tokensInput: data.tokensInput,
          tokensOutput: data.tokensOutput,
          custoTotal: data.custoTotal,
          tempoResposta: data.tempoResposta,
          modelo: data.modelo,
          documentosUsados: data.documentosUsados,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setTotalCusto((prev) => prev + (data.custoTotal || 0));
      setTotalTokens((prev) => prev + (data.tokensUsados || 0));
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!agente) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Simulador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Você precisa criar um agente primeiro.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vá para "Editor de Agente" e configure a persona.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Chat */}
      <div className="col-span-8">
        <Card className="shadow-sm h-[calc(100vh-280px)] flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {agente.nome_agente}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Modelo: {agente.id_modelo_ia}
                </p>
              </div>
              {agente.ativo ? (
                <Badge variant="success">Ativo</Badge>
              ) : (
                <Badge variant="warning">Inativo</Badge>
              )}
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Envie uma mensagem para começar a testar seu agente.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    message.role === 'user'
                      ? 'bg-primary'
                      : 'bg-emerald-500'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Message */}
                <div
                  className={cn(
                    'flex-1 max-w-[70%]',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'px-4 py-2 rounded-lg',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {message.metadata && (
                      <span className="ml-2">
                        · {message.metadata.tokensUsados} tokens
                        · ${message.metadata.custoTotal?.toFixed(6)}
                        · {message.metadata.tempoResposta}ms
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="px-4 py-2 rounded-lg bg-muted inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Sidebar */}
      <div className="col-span-4 space-y-4">
        {/* Custo Total */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Custo da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              ${totalCusto.toFixed(6)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total de tokens: {totalTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Última Resposta */}
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Última Resposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messages[messages.length - 1].metadata && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tokens Input</span>
                    <span className="text-sm font-medium">
                      {messages[messages.length - 1].metadata?.tokensInput || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tokens Output</span>
                    <span className="text-sm font-medium">
                      {messages[messages.length - 1].metadata?.tokensOutput || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tempo</span>
                    <span className="text-sm font-medium">
                      {messages[messages.length - 1].metadata?.tempoResposta || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Custo</span>
                    <span className="text-sm font-medium text-emerald-600">
                      ${messages[messages.length - 1].metadata?.custoTotal?.toFixed(6) || '0.000000'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Docs Usados</span>
                    <span className="text-sm font-medium">
                      {messages[messages.length - 1].metadata?.documentosUsados || 0}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info do Agente */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">Modelo:</span>
              <p className="font-medium mt-1">{agente.id_modelo_ia}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tom de Voz:</span>
              <p className="font-medium mt-1">{agente.tom_voz}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Instruções:</span>
              <p className="font-medium mt-1">
                {Array.isArray(agente.instrucoes) ? agente.instrucoes.length : 0} ativas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dica */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>💡 Dica:</strong> Todos os testes são salvos na tabela `usos_ia` para auditoria e análise de custos.
          </p>
        </div>
      </div>
    </div>
  );
}
