'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentFormData, ModeloIA } from '@/types/agents';
import { GENDER_OPTIONS, COMMUNICATION_OPTIONS } from '@/types/agents';

interface PersonalitySectionProps {
  form: UseFormReturn<AgentFormData>;
  modelos: ModeloIA[];
}

export function PersonalitySection({ form, modelos }: PersonalitySectionProps) {
  const modeloSelecionado = modelos.find(m => m.id_modelo === form.watch('id_modelo_ia'));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Personalidade</h3>
        <p className="text-sm text-muted-foreground">
          Configure a personalidade e características do agente
        </p>
      </div>

      {/* Objetivo */}
      <div className="space-y-2">
        <Label htmlFor="objetivo">Objetivo</Label>
        <Input
          id="objetivo"
          placeholder="Qual o principal objetivo deste agente?"
          {...form.register('objetivo')}
        />
        <p className="text-xs text-muted-foreground">
          O que este agente deve alcançar
        </p>
      </div>

      {/* Identificação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome_agente">Nome do Agente</Label>
          <Input
            id="nome_agente"
            placeholder="Ex: Sofia Atendente"
            {...form.register('nome_agente')}
          />
          <p className="text-xs text-muted-foreground">
            Nome interno para identificação
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome_agente_identificador">Tipo de Agente</Label>
          <Input
            id="nome_agente_identificador"
            placeholder="Ex: Atendente"
            {...form.register('nome_agente_identificador')}
          />
          <p className="text-xs text-muted-foreground">
            Como o agente se apresenta ao cliente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sexo_agente">Gênero</Label>
          <select
            id="sexo_agente"
            value={form.watch('sexo_agente') || 'neutro'}
            onChange={(e) => form.setValue('sexo_agente', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Gênero da persona do agente
          </p>
        </div>
      </div>

      {/* Tom de Voz */}
      <div className="space-y-2">
        <Label htmlFor="tom_voz">Tom de Voz</Label>
        <Textarea
          id="tom_voz"
          placeholder="Ex: Amigável e profissional, com linguagem acessível..."
          rows={2}
          {...form.register('tom_voz')}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Como o agente se comunica
        </p>
      </div>

      {/* Personalidade */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="persona">Personalidade</Label>
          <span className="text-xs text-muted-foreground">
            {form.watch('persona')?.length || 0} caracteres
          </span>
        </div>
        <Textarea
          id="persona"
          placeholder="Descreva a personalidade do agente em detalhes..."
          rows={5}
          {...form.register('persona')}
          className="resize-y min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground">
          Características de comportamento e atitude
        </p>
      </div>

      {/* Configurações Técnicas */}
      <div className="space-y-4 pt-4 border-t">
        <h4 className="text-sm font-semibold">Configurações Técnicas</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id_modelo_ia">Modelo de IA</Label>
            <select
              id="id_modelo_ia"
              value={form.watch('id_modelo_ia') || 'gpt-4o'}
              onChange={(e) => form.setValue('id_modelo_ia', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {modelos.map((modelo) => (
                <option key={modelo.id_modelo} value={modelo.id_modelo}>
                  {modelo.nome_exibicao} ({modelo.provedor})
                </option>
              ))}
            </select>
            {modeloSelecionado && (
              <p className="text-xs text-muted-foreground">
                Custo: ${modeloSelecionado.custo_input_por_1m}/1M in · ${modeloSelecionado.custo_output_por_1m}/1M out
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meio_comunicacao">Meio de Comunicação</Label>
            <select
              id="meio_comunicacao"
              value={form.watch('meio_comunicacao') || 'whatsapp'}
              onChange={(e) => form.setValue('meio_comunicacao', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {COMMUNICATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Ativo */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="ativo" className="text-sm font-medium cursor-pointer">
              Agente Ativo
            </Label>
            <p className="text-xs text-muted-foreground">
              Quando ativo, o agente poderá atender conversas
            </p>
          </div>
          <Switch
            id="ativo"
            checked={form.watch('ativo') ?? false}
            onCheckedChange={(checked) => form.setValue('ativo', checked)}
          />
        </div>
      </div>
    </div>
  );
}
