'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Server, Globe, Key, User, Hash } from 'lucide-react';

interface ConnectionInfoProps {
  config: {
    company_name: string | null;
    url_provedor_upchat: string | null;
    url_socket_upchat: string | null;
    url_eventos_upchat: string | null;
    usuario_upchat: string | null;
    queue_id: string | null;
    api_global_token_upchat: string;
  } | null;
  className?: string;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  isSecret?: boolean;
}

function InfoRow({ icon, label, value, isSecret = false }: InfoRowProps) {
  const displayValue = !value
    ? 'Não configurado'
    : isSecret
      ? `${value.slice(0, 8)}${'•'.repeat(20)}`
      : value;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn(
          'text-sm font-medium truncate',
          !value ? 'text-muted-foreground italic' : 'text-foreground'
        )}>
          {displayValue}
        </p>
      </div>
      {value && (
        <Badge variant="success" className="shrink-0">
          Configurado
        </Badge>
      )}
      {!value && (
        <Badge variant="warning" className="shrink-0">
          Pendente
        </Badge>
      )}
    </div>
  );
}

export function ConnectionInfo({ config, className }: ConnectionInfoProps) {
  if (!config) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Configuração UpChat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma configuração encontrada.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure o UpChat em Parâmetros para começar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Configuração UpChat</CardTitle>
        {config.company_name && (
          <Badge variant="info">{config.company_name}</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          <InfoRow
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            label="URL do Provedor"
            value={config.url_provedor_upchat}
          />
          <InfoRow
            icon={<Server className="h-4 w-4 text-muted-foreground" />}
            label="URL Socket"
            value={config.url_socket_upchat}
          />
          <InfoRow
            icon={<Server className="h-4 w-4 text-muted-foreground" />}
            label="URL Eventos"
            value={config.url_eventos_upchat}
          />
          <InfoRow
            icon={<Key className="h-4 w-4 text-muted-foreground" />}
            label="Token API"
            value={config.api_global_token_upchat}
            isSecret
          />
          <InfoRow
            icon={<User className="h-4 w-4 text-muted-foreground" />}
            label="Usuário"
            value={config.usuario_upchat}
          />
          <InfoRow
            icon={<Hash className="h-4 w-4 text-muted-foreground" />}
            label="Queue ID"
            value={config.queue_id}
          />
        </div>
      </CardContent>
    </Card>
  );
}
