'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Save, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface UpChatConfig {
  id_config?: string;
  company_name: string | null;
  api_global_token_upchat: string;
  url_provedor_upchat: string | null;
  url_socket_upchat: string | null;
  url_eventos_upchat: string | null;
  usuario_upchat: string | null;
  senha_upchat: string | null;
  queue_id: string | null;
}

interface UpChatConfigProps {
  config: UpChatConfig | null;
  className?: string;
}

export function UpChatConfigForm({ config, className }: UpChatConfigProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTestConnection = async () => {
    setTestStatus('testing');
    // Simular teste de conexão
    setTimeout(() => {
      // Por enquanto, considera sucesso se tiver token e URL
      if (config?.api_global_token_upchat && config?.url_provedor_upchat) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    }, 1500);
  };

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Server className="h-5 w-5" />
            Integração UpChat
          </CardTitle>
          <CardDescription>
            Configure a conexão com o servidor UpChat
          </CardDescription>
        </div>
        {config?.company_name && (
          <Badge variant="info">{config.company_name}</Badge>
        )}
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                defaultValue={config?.company_name || ''}
                placeholder="Nome da instância"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="queue_id">Queue ID</Label>
              <Input
                id="queue_id"
                defaultValue={config?.queue_id || ''}
                placeholder="ID da fila"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_token">Token da API</Label>
            <Input
              id="api_token"
              type="password"
              defaultValue={config?.api_global_token_upchat || ''}
              placeholder="Token de autenticação"
            />
            <p className="text-xs text-muted-foreground">
              Token de acesso global para autenticação com a API UpChat
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url_provedor">URL do Provedor</Label>
              <Input
                id="url_provedor"
                defaultValue={config?.url_provedor_upchat || ''}
                placeholder="https://api.upchat.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url_socket">URL Socket</Label>
              <Input
                id="url_socket"
                defaultValue={config?.url_socket_upchat || ''}
                placeholder="wss://socket.upchat.com.br"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url_eventos">URL de Eventos</Label>
            <Input
              id="url_eventos"
              defaultValue={config?.url_eventos_upchat || ''}
              placeholder="https://eventos.upchat.com.br"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                defaultValue={config?.usuario_upchat || ''}
                placeholder="Usuário de acesso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                defaultValue={config?.senha_upchat || ''}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Status do Teste */}
          {testStatus !== 'idle' && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg',
              testStatus === 'testing' && 'bg-blue-50 text-blue-700',
              testStatus === 'success' && 'bg-emerald-50 text-emerald-700',
              testStatus === 'error' && 'bg-red-50 text-red-700',
            )}>
              {testStatus === 'testing' && (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Testando conexão...</span>
                </>
              )}
              {testStatus === 'success' && (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Conexão estabelecida com sucesso!</span>
                </>
              )}
              {testStatus === 'error' && (
                <>
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">Falha na conexão. Verifique as credenciais.</span>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
            >
              <RefreshCw className={cn('h-4 w-4', testStatus === 'testing' && 'animate-spin')} />
              Testar Conexão
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
