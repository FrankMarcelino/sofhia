'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Database, Plus, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Agente, Extracao } from '@/lib/queries/neurocore';

interface ExtracoesTabProps {
  agente: Agente | null;
  extracoes: Extracao[];
  className?: string;
}

interface ExtracaoForm {
  id?: string;
  informacao_para_extrair: string;
  descricao_para_ia: string;
  tipo_dado: 'string' | 'number' | 'boolean' | 'date' | 'json';
}

const TIPOS_DADO = [
  { value: 'string',  label: 'Texto'   },
  { value: 'number',  label: 'Número'  },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'date',    label: 'Data'    },
  { value: 'json',    label: 'JSON'    },
];

export function ExtracoesTab({ agente, extracoes, className }: ExtracoesTabProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [extracoesForm, setExtracoesForm] = useState<ExtracaoForm[]>(() => {
    if (extracoes.length === 0) return [];
    return extracoes.map(e => ({
      id: e.id_agente_extracoes,
      informacao_para_extrair: e.informacao_para_extrair,
      descricao_para_ia: e.descricao_para_ia,
      tipo_dado: e.tipo_dado,
    }));
  });

  const handleAddExtracao = () => {
    setExtracoesForm([
      ...extracoesForm,
      {
        informacao_para_extrair: '',
        descricao_para_ia: '',
        tipo_dado: 'string',
      },
    ]);
  };

  const handleDeleteExtracao = (index: number) => {
    setExtracoesForm(extracoesForm.filter((_, i) => i !== index));
  };

  const handleEditExtracao = (index: number, field: keyof ExtracaoForm, value: string) => {
    setExtracoesForm(extracoesForm.map((e, i) => 
      i === index ? { ...e, [field]: value } : e
    ));
  };

  const handleSubmit = async () => {
    if (!agente) {
      toast({
        title: 'Erro',
        description: 'Você precisa criar a persona antes de adicionar extrações.',
        variant: 'destructive',
      });
      return;
    }

    // Validar campos obrigatórios
    const extracoesValidas = extracoesForm.filter(e => 
      e.informacao_para_extrair.trim() && e.descricao_para_ia.trim()
    );

    if (extracoesValidas.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Preencha pelo menos uma extração válida.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Deletar todas as extrações existentes
      const { error: deleteError } = await supabase
        .from('agente_extracoes')
        .delete()
        .eq('id_agente', agente.id_agente);

      if (deleteError) {
        console.error('Erro ao deletar extrações:', deleteError);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível atualizar as extrações. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Inserir novas extrações
      if (extracoesValidas.length > 0) {
        const extracoesPayload = extracoesValidas.map(e => ({
          id_agente: agente.id_agente,
          informacao_para_extrair: e.informacao_para_extrair,
          descricao_para_ia: e.descricao_para_ia,
          tipo_dado: e.tipo_dado,
        }));

        const { error: insertError } = await supabase
          .from('agente_extracoes')
          .insert(extracoesPayload);

        if (insertError) {
          console.error('Erro ao inserir extrações:', insertError);
          toast({
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar as extrações. Tente novamente.',
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        title: 'Sucesso!',
        description: `${extracoesValidas.length} extrações salvas com sucesso.`,
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

  if (!agente) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Extrações de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Você precisa criar a persona do agente primeiro.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vá para a aba Persona e salve as configurações básicas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Extrações de Dados
          </CardTitle>
          <CardDescription>
            Defina quais informações o agente deve coletar durante a conversa
          </CardDescription>
        </div>
        <Badge variant="info">{extracoesForm.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {extracoesForm.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <Database className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma extração configurada ainda.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em Adicionar Extração para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {extracoesForm.map((extracao, index) => (
              <div
                key={index}
                className="p-4 bg-muted/50 rounded-lg border border-border space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="mt-1">
                    #{index + 1}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleDeleteExtracao(index)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`info-${index}`}>Campo a Extrair *</Label>
                    <Input
                      id={`info-${index}`}
                      value={extracao.informacao_para_extrair}
                      onChange={(e) => handleEditExtracao(index, 'informacao_para_extrair', e.target.value)}
                      placeholder="Ex: Nome Completo"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`tipo-${index}`}>Tipo de Dado</Label>
                    <select
                      id={`tipo-${index}`}
                      value={extracao.tipo_dado}
                      onChange={(e) => handleEditExtracao(index, 'tipo_dado', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {TIPOS_DADO.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`desc-${index}`}>Descrição para IA *</Label>
                  <textarea
                    id={`desc-${index}`}
                    value={extracao.descricao_para_ia}
                    onChange={(e) => handleEditExtracao(index, 'descricao_para_ia', e.target.value)}
                    placeholder="Como a IA deve perguntar e validar esta informação..."
                    className="w-full min-h-[60px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: Pergunte o nome completo do cliente e certifique-se que informou nome e sobrenome
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddExtracao}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Extração
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || extracoesForm.length === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar Extrações'}
          </Button>
        </div>

        {/* Dica */}
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-900 dark:text-amber-100">
            <strong>Exemplo de Extração:</strong><br />
            Campo: CPF do Cliente | Tipo: CPF | Descrição: Pergunte o CPF e valide se tem 11 dígitos. Se inválido, peça novamente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
