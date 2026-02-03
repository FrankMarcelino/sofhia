'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, Plus, Trash2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Dominio } from '@/lib/queries/neurocore';

interface DominiosListProps {
  dominios: Dominio[];
  empresaId: string | undefined;
  className?: string;
}

export function DominiosList({ dominios: initialDominios, empresaId, className }: DominiosListProps) {
  const { toast } = useToast();
  const [dominios, setDominios] = useState(initialDominios);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });

  const handleAdd = async () => {
    if (!empresaId || !formData.nome.trim()) {
      toast({
        title: 'Atenção',
        description: 'Preencha o nome do domínio.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('conhecimento_dominios')
        .insert({
          id_empresa: empresaId,
          nome: formData.nome,
          descricao: formData.descricao || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar domínio:', error);
        toast({
          title: 'Erro ao criar',
          description: 'Não foi possível criar o domínio. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setDominios([...dominios, data]);
      setFormData({ nome: '', descricao: '' });
      setIsAdding(false);
      
      toast({
        title: 'Sucesso!',
        description: 'Domínio criado com sucesso.',
      });
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Todos os documentos deste domínio ficarão sem categoria.')) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('conhecimento_dominios')
        .delete()
        .eq('id_dominio', id);

      if (error) {
        console.error('Erro ao deletar domínio:', error);
        toast({
          title: 'Erro ao deletar',
          description: 'Não foi possível deletar o domínio. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setDominios(dominios.filter(d => d.id_dominio !== id));
      
      toast({
        title: 'Sucesso!',
        description: 'Domínio removido com sucesso.',
      });
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Domínios
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Organize documentos por categorias
          </p>
        </div>
        <Badge variant="info">{dominios.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Lista de domínios */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {dominios.map((dominio) => (
            <div
              key={dominio.id_dominio}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors',
                'hover:bg-muted/50 border-border'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {dominio.nome}
                </p>
                {dominio.descricao && (
                  <p className="text-xs text-muted-foreground truncate">
                    {dominio.descricao}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => handleDelete(dominio.id_dominio)}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {dominios.length === 0 && !isAdding && (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum domínio criado ainda.
              </p>
            </div>
          )}
        </div>

        {/* Form de adicionar */}
        {isAdding ? (
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Domínio *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: FAQ, Produtos, Políticas"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={isLoading}
                size="sm"
                className="gap-2 flex-1"
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ nome: '', descricao: '' });
                }}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full gap-2"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            Novo Domínio
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
