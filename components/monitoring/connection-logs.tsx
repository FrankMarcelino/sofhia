'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Terminal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface ConnectionLogsProps {
  logs?: LogEntry[];
  className?: string;
}

const levelColors: Record<LogEntry['level'], string> = {
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  success: 'text-emerald-400',
};

const levelPrefixes: Record<LogEntry['level'], string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  success: 'OK',
};

// Logs simulados para demonstração (timestamps fixos para evitar erro de hidratação)
const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date('2026-02-03T18:37:00Z').toISOString(),
    level: 'success',
    message: 'Conexão com UpChat estabelecida',
  },
  {
    id: '2',
    timestamp: new Date('2026-02-03T18:36:00Z').toISOString(),
    level: 'info',
    message: 'Health check executado com sucesso',
  },
  {
    id: '3',
    timestamp: new Date('2026-02-03T18:35:00Z').toISOString(),
    level: 'info',
    message: 'Socket reconectado automaticamente',
  },
  {
    id: '4',
    timestamp: new Date('2026-02-03T18:32:00Z').toISOString(),
    level: 'warn',
    message: 'Latência elevada detectada (450ms)',
  },
  {
    id: '5',
    timestamp: new Date('2026-02-03T18:27:00Z').toISOString(),
    level: 'success',
    message: 'Webhook recebido e processado',
  },
  {
    id: '6',
    timestamp: new Date('2026-02-03T18:22:00Z').toISOString(),
    level: 'info',
    message: 'Agente Sophie Bot ativado',
  },
  {
    id: '7',
    timestamp: new Date('2026-02-03T18:17:00Z').toISOString(),
    level: 'success',
    message: 'Serviço iniciado com sucesso',
  },
];

function formatLogTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function ConnectionLogs({ logs = mockLogs, className }: ConnectionLogsProps) {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg font-bold">Logs de Conexão</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm max-h-[400px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-slate-500">Nenhum log disponível</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">
                    [{formatLogTime(log.timestamp)}]
                  </span>
                  <span className={cn('shrink-0 font-semibold', levelColors[log.level])}>
                    [{levelPrefixes[log.level]}]
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Exibindo últimos {logs.length} eventos • Atualização automática a cada 30s
        </p>
      </CardContent>
    </Card>
  );
}
