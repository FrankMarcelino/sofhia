'use client';

import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bot, Save, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Agente, ModeloIA } from '@/lib/queries/neurocore';

interface PersonaTabProps {
  agente: Agente | null;
  modelos: ModeloIA[];
  empresaId: string | undefined;
  className?: string;
}

export function PersonaTab({ agente, modelos, empresaId, className }: PersonaTabProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_agente: agente?.nome_agente || '',
    persona: agente?.persona || '',
    tom_voz: agente?.tom_voz || '',
    objetivo: agente?.objetivo || '',
    meio_comunicacao: agente?.meio_comunicacao || 'whatsapp',
    nome_agente_identificador: agente?.nome_agente_identificador || '',
    sexo_agente: agente?.sexo_agente || 'neutro',
    id_modelo_ia: agente?.id_modelo_ia || 'gpt-4o',
    ativo: agente?.ativo ?? false,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!empresaId) {
      toast({
        title: 'Erro',
        description: 'Empresa não encontrada.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Buscar neurocore padrão da empresa
      const { data: neurocoreData } = await supabase
        .from('neurocores')
        .select('id_neurocore')
        .eq('id_empresa', empresaId)
        .single();

      if (!neurocoreData) {
        toast({
          title: 'Erro',
          description: 'Neurocore não encontrado.',
          variant: 'destructive',
        });
        return;
      }

      // Buscar tipo de agente padrão
      const { data: tipoAgenteData } = await supabase
        .from('agentes_tipos')
        .select('id_agentes_tipos')
        .eq('id_neurocore', neurocoreData.id_neurocore)
        .limit(1)
        .single();

      const agentePayload = {
        id_empresa: empresaId,
        id_neurocore: neurocoreData.id_neurocore,
        id_tipo_agente: tipoAgenteData?.id_agentes_tipos,
        nome_agente: formData.nome_agente,
        persona: formData.persona,
        tom_voz: formData.tom_voz,
        objetivo: formData.objetivo,
        meio_comunicacao: formData.meio_comunicacao,
        nome_agente_identificador: formData.nome_agente_identificador || null,
        sexo_agente: formData.sexo_agente,
        id_modelo_ia: formData.id_modelo_ia,
        ativo: formData.ativo,
      };

      let error;

      if (agente) {
        // Update
        const result = await supabase
          .from('agentes')
          .update(agentePayload)
          .eq('id_agente', agente.id_agente);
        error = result.error;
      } else {
        // Insert
        const result = await supabase
          .from('agentes')
          .insert(agentePayload);
        error = result.error;
      }

      if (error) {
        console.error('Erro ao salvar agente:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar o agente. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Persona do agente salva com sucesso.',
      });

      // Recarregar página para atualizar dados
      window.location.reload();
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

  const modeloSelecionado = modelos.find(m => m.id_modelo === formData.id_modelo_ia);

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Configuração de Persona
          </CardTitle>
          <CardDescription>
            Defina a personalidade e características do seu agente de IA
          </CardDescription>
        </div>
        {agente && (
          <Badge variant={agente.ativo ? 'success' : 'warning'}>
            {agente.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identificação */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Identificação
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_agente">Nome do Agente *</Label>
                <Input
                  id="nome_agente"
                  value={formData.nome_agente}
                  onChange={(e) => setFormData({ ...formData, nome_agente: e.target.value })}
                  placeholder="Ex: Sofia Atendente"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome_identificador">Nome para Cliente</Label>
                <Input
                  id="nome_identificador"
                  value={formData.nome_agente_identificador}
                  onChange={(e) => setFormData({ ...formData, nome_agente_identificador: e.target.value })}
                  placeholder="Ex: Sofia"
                />
                <p className="text-xs text-muted-foreground">
                  Como o agente se apresenta ao cliente
                </p>
              </div>
            </div>
          </div>

          {/* Persona e Tom */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Personalidade</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="persona">Persona *</Label>
                <textarea
                  id="persona"
                  value={formData.persona}
                  onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                  placeholder="Descreva a personalidade do agente..."
                  className="w-full min-h-[100px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tom_voz">Tom de Voz *</Label>
                  <Input
                    id="tom_voz"
                    value={formData.tom_voz}
                    onChange={(e) => setFormData({ ...formData, tom_voz: e.target.value })}
                    placeholder="Ex: Amigável e profissional"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Gênero</Label>
                  <select
                    id="sexo"
                    value={formData.sexo_agente}
                    onChange={(e) => setFormData({ ...formData, sexo_agente: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="neutro">Neutro</option>
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo do Agente *</Label>
            <textarea
              id="objetivo"
              value={formData.objetivo}
              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
              placeholder="Qual o principal objetivo deste agente?"
              className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Configurações Técnicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Configurações Técnicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo de IA</Label>
                <select
                  id="modelo"
                  value={formData.id_modelo_ia}
                  onChange={(e) => setFormData({ ...formData, id_modelo_ia: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {modelos.map((modelo) => (
                    <option key={modelo.id_modelo} value={modelo.id_modelo}>
                      {modelo.nome_modelo} ({modelo.provedor})
                    </option>
                  ))}
                </select>
                {modeloSelecionado && (
                  <p className="text-xs text-muted-foreground">
                    Custo: ${modeloSelecionado.custo_input}/1K in · ${modeloSelecionado.custo_output}/1K out
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="meio">Meio de Comunicação</Label>
                <select
                  id="meio"
                  value={formData.meio_comunicacao}
                  onChange={(e) => setFormData({ ...formData, meio_comunicacao: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="webchat">WebChat</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="ativo" className="text-sm font-medium cursor-pointer">
                Agente Ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Quando ativo, o agente poderá atender conversas
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <Button type="submit" className="gap-2" disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : agente ? 'Atualizar Persona' : 'Criar Agente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
