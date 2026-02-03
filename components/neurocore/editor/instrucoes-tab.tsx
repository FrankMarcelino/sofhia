'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ListOrdered, Plus, GripVertical, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Agente } from '@/lib/queries/neurocore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InstrucoesTabProps {
  agente: Agente | null;
  className?: string;
}

interface InstrucaoItem {
  id: string;
  texto: string;
}

function SortableInstrucao({ instrucao, onDelete, onEdit }: {
  instrucao: InstrucaoItem;
  onDelete: (id: string) => void;
  onEdit: (id: string, texto: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: instrucao.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-muted/50 rounded-lg border-2 border-transparent',
        isDragging && 'opacity-50 border-primary'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      
      <Input
        value={instrucao.texto}
        onChange={(e) => onEdit(instrucao.id, e.target.value)}
        className="flex-1 bg-background"
        placeholder="Digite a instrução..."
      />
      
      <button
        type="button"
        onClick={() => onDelete(instrucao.id)}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function InstrucoesTab({ agente, className }: InstrucoesTabProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [instrucoes, setInstrucoes] = useState<InstrucaoItem[]>(() => {
    if (!agente || !Array.isArray(agente.instrucoes)) return [];
    return agente.instrucoes.map((texto, idx) => ({
      id: `instrucao-${idx}`,
      texto,
    }));
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setInstrucoes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddInstrucao = () => {
    const newId = `instrucao-${Date.now()}`;
    setInstrucoes([...instrucoes, { id: newId, texto: '' }]);
  };

  const handleDeleteInstrucao = (id: string) => {
    setInstrucoes(instrucoes.filter(i => i.id !== id));
  };

  const handleEditInstrucao = (id: string, texto: string) => {
    setInstrucoes(instrucoes.map(i => i.id === id ? { ...i, texto } : i));
  };

  const handleSubmit = async () => {
    if (!agente) {
      toast({
        title: 'Erro',
        description: 'Você precisa criar a persona antes de adicionar instruções.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Filtrar instruções vazias e converter para array de strings
      const instrucoesTexto = instrucoes
        .map(i => i.texto.trim())
        .filter(t => t.length > 0);

      const { error } = await supabase
        .from('agentes')
        .update({ instrucoes: instrucoesTexto })
        .eq('id_agente', agente.id_agente);

      if (error) {
        console.error('Erro ao salvar instruções:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as instruções. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: `${instrucoesTexto.length} instruções salvas com sucesso.`,
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

  if (!agente) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Instruções do Agente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ListOrdered className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Você precisa criar a persona do agente primeiro.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vá para a aba "Persona" e salve as configurações básicas.
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
            <ListOrdered className="h-5 w-5" />
            Instruções do Agente
          </CardTitle>
          <CardDescription>
            Arraste para reordenar. As instruções serão seguidas nesta ordem.
          </CardDescription>
        </div>
        <Badge variant="info">{instrucoes.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {instrucoes.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <ListOrdered className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma instrução adicionada ainda.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Adicionar Instrução" para começar.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={instrucoes.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {instrucoes.map((instrucao) => (
                  <SortableInstrucao
                    key={instrucao.id}
                    instrucao={instrucao}
                    onDelete={handleDeleteInstrucao}
                    onEdit={handleEditInstrucao}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddInstrucao}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Instrução
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || instrucoes.length === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar Instruções'}
          </Button>
        </div>

        {/* Dica */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>💡 Dica:</strong> Seja específico nas instruções. Exemplo: "Sempre pergunte o nome completo do cliente antes de oferecer produtos"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
