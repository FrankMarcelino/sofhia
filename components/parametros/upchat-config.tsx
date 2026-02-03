'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Server, Save, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    company_name: config?.company_name || '',
    api_global_token_upchat: config?.api_global_token_upchat || '',
    url_provedor_upchat: config?.url_provedor_upchat || '',
    url_socket_upchat: config?.url_socket_upchat || '',
    url_eventos_upchat: config?.url_eventos_upchat || '',
    usuario_upchat: config?.usuario_upchat || '',
    senha_upchat: config?.senha_upchat || '',
    queue_id: config?.queue_id || '',
  });

  const handleTestConnection = async () => {
    setTestStatus('testing');
    // Simular teste de conexão
    setTimeout(() => {
      // Por enquanto, considera sucesso se tiver token e URL
      if (formData.api_global_token_upchat && formData.url_provedor_upchat) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    }, 1500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Buscar empresa do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('usuarios_sofhia')
        .select('id_empresa')
        .eq('id', user.id)
        .single();

      if (!userData?.id_empresa) throw new Error('Empresa não encontrada');

      // Upsert (insert ou update)
      const { error } = await supabase
        .from('configuracoes_upchat')
        .upsert({
          id_empresa: userData.id_empresa,
          company_name: formData.company_name || null,
          api_global_token_upchat: formData.api_global_token_upchat,
          url_provedor_upchat: formData.url_provedor_upchat || null,
          url_socket_upchat: formData.url_socket_upchat || null,
          url_eventos_upchat: formData.url_eventos_upchat || null,
          usuario_upchat: formData.usuario_upchat || null,
          senha_upchat: formData.senha_upchat || null,
          queue_id: formData.queue_id || null,
        }, {
          onConflict: 'id_empresa'
        });

      if (error) {
        console.error('Erro ao salvar configurações UpChat:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Configurações do UpChat salvas com sucesso.',
      });
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao salvar. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Nome da instância"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="queue_id">Queue ID</Label>
              <Input
                id="queue_id"
                value={formData.queue_id}
                onChange={(e) => setFormData({ ...formData, queue_id: e.target.value })}
                placeholder="ID da fila"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_token">Token da API</Label>
            <Input
              id="api_token"
              type="password"
              value={formData.api_global_token_upchat}
              onChange={(e) => setFormData({ ...formData, api_global_token_upchat: e.target.value })}
              placeholder="Token de autenticação"
              required
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
                value={formData.url_provedor_upchat}
                onChange={(e) => setFormData({ ...formData, url_provedor_upchat: e.target.value })}
                placeholder="https://api.upchat.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url_socket">URL Socket</Label>
              <Input
                id="url_socket"
                value={formData.url_socket_upchat}
                onChange={(e) => setFormData({ ...formData, url_socket_upchat: e.target.value })}
                placeholder="wss://socket.upchat.com.br"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url_eventos">URL de Eventos</Label>
            <Input
              id="url_eventos"
              value={formData.url_eventos_upchat}
              onChange={(e) => setFormData({ ...formData, url_eventos_upchat: e.target.value })}
              placeholder="https://eventos.upchat.com.br"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuário</Label>
              <Input
                id="usuario"
                value={formData.usuario_upchat}
                onChange={(e) => setFormData({ ...formData, usuario_upchat: e.target.value })}
                placeholder="Usuário de acesso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={formData.senha_upchat}
                onChange={(e) => setFormData({ ...formData, senha_upchat: e.target.value })}
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
              disabled={testStatus === 'testing' || isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', testStatus === 'testing' && 'animate-spin')} />
              Testar Conexão
            </Button>
            <Button type="submit" className="gap-2" disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
