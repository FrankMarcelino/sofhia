'use client';

import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bot, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface PreferenciasIA {
  id_preferencia?: string;
  transcrever_audio_cliente: boolean;
  responder_em_audio_se_receber_audio: boolean;
  extrair_dados_documentos: boolean;
  simular_digitacao: boolean;
  tempo_medio_digitacao_segundos: number;
  maximo_tentativas_ia: number;
  transbordo_automatico_erro: boolean;
  nome_fila_transbordo: string | null;
  buffer_time: number;
}

interface PreferenciasIAProps {
  preferencias: PreferenciasIA | null;
  className?: string;
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}

export function PreferenciasIAForm({ preferencias, className }: PreferenciasIAProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const defaultPrefs = {
    transcrever_audio_cliente: true,
    responder_em_audio_se_receber_audio: false,
    extrair_dados_documentos: true,
    simular_digitacao: true,
    tempo_medio_digitacao_segundos: 3,
    maximo_tentativas_ia: 3,
    transbordo_automatico_erro: true,
    nome_fila_transbordo: null,
    buffer_time: 9,
  };

  const [formData, setFormData] = useState({
    transcrever_audio_cliente: preferencias?.transcrever_audio_cliente ?? defaultPrefs.transcrever_audio_cliente,
    responder_em_audio_se_receber_audio: preferencias?.responder_em_audio_se_receber_audio ?? defaultPrefs.responder_em_audio_se_receber_audio,
    extrair_dados_documentos: preferencias?.extrair_dados_documentos ?? defaultPrefs.extrair_dados_documentos,
    simular_digitacao: preferencias?.simular_digitacao ?? defaultPrefs.simular_digitacao,
    tempo_medio_digitacao_segundos: preferencias?.tempo_medio_digitacao_segundos ?? defaultPrefs.tempo_medio_digitacao_segundos,
    maximo_tentativas_ia: preferencias?.maximo_tentativas_ia ?? defaultPrefs.maximo_tentativas_ia,
    transbordo_automatico_erro: preferencias?.transbordo_automatico_erro ?? defaultPrefs.transbordo_automatico_erro,
    nome_fila_transbordo: preferencias?.nome_fila_transbordo ?? defaultPrefs.nome_fila_transbordo,
    buffer_time: preferencias?.buffer_time ?? defaultPrefs.buffer_time,
  });

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
        .from('empresa_preferencias_ia')
        .upsert({
          id_empresa: userData.id_empresa,
          transcrever_audio_cliente: formData.transcrever_audio_cliente,
          responder_em_audio_se_receber_audio: formData.responder_em_audio_se_receber_audio,
          extrair_dados_documentos: formData.extrair_dados_documentos,
          simular_digitacao: formData.simular_digitacao,
          tempo_medio_digitacao_segundos: formData.tempo_medio_digitacao_segundos,
          maximo_tentativas_ia: formData.maximo_tentativas_ia,
          transbordo_automatico_erro: formData.transbordo_automatico_erro,
          nome_fila_transbordo: formData.nome_fila_transbordo || null,
          buffer_time: formData.buffer_time,
        }, {
          onConflict: 'id_empresa'
        });

      if (error) {
        console.error('Erro ao salvar preferências de IA:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as preferências. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Preferências de IA salvas com sucesso.',
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
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Preferências de IA
        </CardTitle>
        <CardDescription>
          Configure o comportamento global dos agentes de IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Toggles Section */}
          <div className="space-y-0">
            <ToggleRow
              id="transcrever_audio"
              label="Transcrever áudios do cliente"
              description="Converter automaticamente áudios recebidos em texto"
              checked={formData.transcrever_audio_cliente}
              onChange={(checked) => setFormData({ ...formData, transcrever_audio_cliente: checked })}
            />
            <ToggleRow
              id="responder_audio"
              label="Responder em áudio"
              description="Responder com áudio quando o cliente enviar áudio"
              checked={formData.responder_em_audio_se_receber_audio}
              onChange={(checked) => setFormData({ ...formData, responder_em_audio_se_receber_audio: checked })}
            />
            <ToggleRow
              id="extrair_documentos"
              label="Extrair dados de documentos"
              description="Analisar imagens de documentos enviados"
              checked={formData.extrair_dados_documentos}
              onChange={(checked) => setFormData({ ...formData, extrair_dados_documentos: checked })}
            />
            <ToggleRow
              id="simular_digitacao"
              label="Simular digitação"
              description="Mostrar indicador de digitação antes de responder"
              checked={formData.simular_digitacao}
              onChange={(checked) => setFormData({ ...formData, simular_digitacao: checked })}
            />
            <ToggleRow
              id="transbordo_erro"
              label="Transbordo automático em erro"
              description="Transferir para humano quando a IA falhar"
              checked={formData.transbordo_automatico_erro}
              onChange={(checked) => setFormData({ ...formData, transbordo_automatico_erro: checked })}
            />
          </div>

          {/* Numeric Settings */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="tempo_digitacao">Tempo de digitação (s)</Label>
              <Input
                id="tempo_digitacao"
                type="number"
                min={1}
                max={10}
                value={formData.tempo_medio_digitacao_segundos}
                onChange={(e) => setFormData({ ...formData, tempo_medio_digitacao_segundos: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">Delay simulado</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_tentativas">Máx. tentativas</Label>
              <Input
                id="max_tentativas"
                type="number"
                min={1}
                max={10}
                value={formData.maximo_tentativas_ia}
                onChange={(e) => setFormData({ ...formData, maximo_tentativas_ia: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">Antes do transbordo</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer_time">Buffer time (s)</Label>
              <Input
                id="buffer_time"
                type="number"
                min={1}
                max={30}
                value={formData.buffer_time}
                onChange={(e) => setFormData({ ...formData, buffer_time: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">Aguardar mensagens</p>
            </div>
          </div>

          {/* Transbordo Queue */}
          <div className="space-y-2 pt-2">
            <Label htmlFor="fila_transbordo">Fila de Transbordo</Label>
            <Input
              id="fila_transbordo"
              value={formData.nome_fila_transbordo || ''}
              onChange={(e) => setFormData({ ...formData, nome_fila_transbordo: e.target.value })}
              placeholder="Nome da fila para transferências"
            />
            <p className="text-xs text-muted-foreground">
              Fila padrão para transferência de conversas para atendimento humano
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="gap-2" disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
