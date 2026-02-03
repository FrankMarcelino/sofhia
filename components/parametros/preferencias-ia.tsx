'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bot, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  defaultChecked: boolean;
}

function ToggleRow({ id, label, description, defaultChecked }: ToggleRowProps) {
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
          defaultChecked={defaultChecked}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}

export function PreferenciasIAForm({ preferencias, className }: PreferenciasIAProps) {
  const prefs = preferencias || {
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
        <form className="space-y-4">
          {/* Toggles Section */}
          <div className="space-y-0">
            <ToggleRow
              id="transcrever_audio"
              label="Transcrever áudios do cliente"
              description="Converter automaticamente áudios recebidos em texto"
              defaultChecked={prefs.transcrever_audio_cliente}
            />
            <ToggleRow
              id="responder_audio"
              label="Responder em áudio"
              description="Responder com áudio quando o cliente enviar áudio"
              defaultChecked={prefs.responder_em_audio_se_receber_audio}
            />
            <ToggleRow
              id="extrair_documentos"
              label="Extrair dados de documentos"
              description="Analisar imagens de documentos enviados"
              defaultChecked={prefs.extrair_dados_documentos}
            />
            <ToggleRow
              id="simular_digitacao"
              label="Simular digitação"
              description="Mostrar indicador de digitação antes de responder"
              defaultChecked={prefs.simular_digitacao}
            />
            <ToggleRow
              id="transbordo_erro"
              label="Transbordo automático em erro"
              description="Transferir para humano quando a IA falhar"
              defaultChecked={prefs.transbordo_automatico_erro}
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
                defaultValue={prefs.tempo_medio_digitacao_segundos}
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
                defaultValue={prefs.maximo_tentativas_ia}
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
                defaultValue={prefs.buffer_time}
              />
              <p className="text-xs text-muted-foreground">Aguardar mensagens</p>
            </div>
          </div>

          {/* Transbordo Queue */}
          <div className="space-y-2 pt-2">
            <Label htmlFor="fila_transbordo">Fila de Transbordo</Label>
            <Input
              id="fila_transbordo"
              defaultValue={prefs.nome_fila_transbordo || ''}
              placeholder="Nome da fila para transferências"
            />
            <p className="text-xs text-muted-foreground">
              Fila padrão para transferência de conversas para atendimento humano
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Preferências
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
