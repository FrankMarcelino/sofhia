'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Bot } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Agente, AgentFormData, ModeloIA, GuidelineStep } from '@/types/agents';
import {
  PersonalitySection,
  LimitationsSection,
  InstructionsSection,
  GuidelineSection,
  RulesSection,
  OthersInstructionsSection,
} from './form-sections';
import { ExtracoesTab } from './extracoes-tab';
import type { Extracao } from '@/lib/queries/neurocore';

interface AgentEditTabsProps {
  agente: Agente;
  modelos: ModeloIA[];
  extracoes: Extracao[];
}

// Helper para converter array de strings para GuidelineStep[]
function convertToGuidelineSteps(data: GuidelineStep[] | string[] | null): GuidelineStep[] {
  if (!data) return [];

  // Se já é GuidelineStep[], retorna
  if (data.length > 0 && typeof data[0] === 'object' && 'title' in data[0]) {
    return data as GuidelineStep[];
  }

  // Se é array de strings, converte
  return (data as string[]).map((item) => ({
    title: item,
    type: 'markdown' as const,
    active: true,
    sub: [],
  }));
}

export function AgentEditTabs({ agente, modelos, extracoes }: AgentEditTabsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AgentFormData>({
    defaultValues: {
      // Personalidade
      nome_agente: agente.nome_agente || '',
      nome_agente_identificador: agente.nome_agente_identificador || '',
      persona: agente.persona || '',
      tom_voz: agente.tom_voz || '',
      objetivo: agente.objetivo || '',
      sexo_agente: agente.sexo_agente || 'neutro',
      meio_comunicacao: agente.meio_comunicacao || 'whatsapp',
      id_modelo_ia: agente.id_modelo_ia || 'gpt-4o',
      ativo: agente.ativo ?? false,

      // Campos JSONB
      limitacoes: convertToGuidelineSteps(agente.limitacoes),
      instrucoes: convertToGuidelineSteps(agente.instrucoes),
      roteiro: convertToGuidelineSteps(agente.roteiro),
      rules: agente.rules || [],
      others_instructions: agente.others_instructions || [],
    },
  });

  async function onSubmit(data: AgentFormData) {
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('agentes')
        .update({
          nome_agente: data.nome_agente,
          nome_agente_identificador: data.nome_agente_identificador || null,
          persona: data.persona,
          tom_voz: data.tom_voz,
          objetivo: data.objetivo,
          sexo_agente: data.sexo_agente,
          meio_comunicacao: data.meio_comunicacao,
          id_modelo_ia: data.id_modelo_ia,
          ativo: data.ativo,
          limitacoes: data.limitacoes,
          instrucoes: data.instrucoes,
          roteiro: data.roteiro,
          rules: data.rules,
          others_instructions: data.others_instructions,
          updated_at: new Date().toISOString(),
        })
        .eq('id_agente', agente.id_agente);

      if (error) {
        console.error('Erro ao atualizar agente:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as alterações. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Configuração do agente atualizada.',
      });

      // Reset form para marcar como não-modificado
      form.reset(data);

      // Refresh para atualizar dados do servidor
      router.refresh();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao salvar. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">
              {agente.nome_agente}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure as características do seu agente
            </p>
          </div>
        </div>
        <Badge variant={agente.ativo ? 'success' : 'warning'}>
          {agente.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
            <Tabs defaultValue="personality" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto flex-wrap gap-1 bg-transparent p-0 mb-6">
                <TabsTrigger value="personality" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  Personalidade
                </TabsTrigger>
                <TabsTrigger value="limitations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  Limitações
                </TabsTrigger>
                <TabsTrigger value="instructions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  Instruções
                </TabsTrigger>
                <TabsTrigger value="guideline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  Guideline
                </TabsTrigger>
                <TabsTrigger value="rules" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  Regras
                </TabsTrigger>
                <TabsTrigger value="others" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  Outras
                </TabsTrigger>
                <TabsTrigger value="extracoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">
                  Extrações
                </TabsTrigger>
              </TabsList>

              <div className="min-h-[400px]">
                <TabsContent value="personality" className="mt-0">
                  <PersonalitySection form={form} modelos={modelos} />
                </TabsContent>

                <TabsContent value="limitations" className="mt-0">
                  <LimitationsSection form={form} />
                </TabsContent>

                <TabsContent value="instructions" className="mt-0">
                  <InstructionsSection form={form} />
                </TabsContent>

                <TabsContent value="guideline" className="mt-0">
                  <GuidelineSection form={form} />
                </TabsContent>

                <TabsContent value="rules" className="mt-0">
                  <RulesSection form={form} />
                </TabsContent>

                <TabsContent value="others" className="mt-0">
                  <OthersInstructionsSection form={form} />
                </TabsContent>

                <TabsContent value="extracoes" className="mt-0">
                  <ExtracoesTab agente={agente as never} extracoes={extracoes} />
                </TabsContent>
              </div>
            </Tabs>

            {/* Footer com ações */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
