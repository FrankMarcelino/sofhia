'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { CoberturaFormDialog } from './cobertura-form-dialog';
import type { Cobertura } from '@/lib/types/cobertura';
import { inferirTipoCobertura, TIPOS_COBERTURA_LABEL } from '@/lib/types/cobertura';

interface CoberturaListProps {
  coberturas: Cobertura[];
  empresaId: string;
  className?: string;
}

function formatLocation(c: Cobertura): string {
  const tipo = inferirTipoCobertura(c);

  switch (tipo) {
    case 'faixa_cep':
      return `CEP ${c.cep_inicio || '?'} a ${c.cep_fim || '?'}`;
    case 'logradouro': {
      const parts = [c.logradouro];
      if (c.numero_inicio || c.numero_fim) {
        parts.push([c.numero_inicio, c.numero_fim].filter(Boolean).join('-'));
      }
      if (c.bairro) parts.push(c.bairro);
      if (c.cidade) parts.push(c.cidade);
      return parts.join(', ');
    }
    case 'bairro': {
      const parts = [c.bairro, c.cidade].filter(Boolean);
      if (c.estado) return `${parts.join(', ')} - ${c.estado}`;
      return parts.join(', ');
    }
    case 'cidade':
      return c.estado ? `${c.cidade} - ${c.estado}` : c.cidade || 'Sem localização';
    case 'estado':
      return c.estado || 'Sem localização';
    default:
      return 'Sem localização';
  }
}

export function CoberturaList({ coberturas: initialCoberturas, empresaId, className }: CoberturaListProps) {
  const { toast } = useToast();
  const [coberturas, setCoberturas] = useState(initialCoberturas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCobertura, setEditingCobertura] = useState<Cobertura | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaved = (cobertura: Cobertura) => {
    if (editingCobertura) {
      setCoberturas(coberturas.map((c) => (c.id === cobertura.id ? cobertura : c)));
    } else {
      setCoberturas([cobertura, ...coberturas]);
    }
    setEditingCobertura(null);
  };

  const handleEdit = (cobertura: Cobertura) => {
    setEditingCobertura(cobertura);
    setDialogOpen(true);
  };

  const handleNewClick = () => {
    setEditingCobertura(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('conhecimento_cobertura')
        .delete()
        .eq('id', id);

      if (error) {
        toast({ title: 'Erro ao deletar', description: 'Não foi possível remover a cobertura.', variant: 'destructive' });
        return;
      }

      setCoberturas(coberturas.filter((c) => c.id !== id));
      toast({ title: 'Sucesso!', description: 'Área de cobertura removida.' });
    } catch {
      toast({ title: 'Erro inesperado', description: 'Ocorreu um erro. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <Card className={cn('shadow-sm', className)}>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Áreas de Cobertura
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Gerencie as áreas de atendimento do seu agente
            </p>
          </div>
          <Button size="sm" onClick={handleNewClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Cobertura
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {coberturas.map((cobertura) => {
              const tipo = inferirTipoCobertura(cobertura);
              return (
                <div
                  key={cobertura.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">
                        {formatLocation(cobertura)}
                      </p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {TIPOS_COBERTURA_LABEL[tipo]}
                      </Badge>
                      <Badge variant={cobertura.status_disponibilidade ? 'success' : 'error'}>
                        {cobertura.status_disponibilidade ? 'Disponível' : 'Indisponível'}
                      </Badge>
                    </div>
                    {cobertura.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                        {cobertura.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleEdit(cobertura)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cobertura.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {coberturas.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma área de cobertura cadastrada.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em &quot;Nova Cobertura&quot; para adicionar.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CoberturaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cobertura={editingCobertura}
        empresaId={empresaId}
        onSaved={handleSaved}
      />

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta área de cobertura? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
