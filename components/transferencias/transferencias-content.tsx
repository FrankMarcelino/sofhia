'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { TransferenciaFormDialog } from './transferencia-form-dialog';
import { Plus, Pencil, Trash2, ArrowRightLeft, Filter, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransferenciaDepartamento } from '@/lib/queries/transferencias';

const TIPO_TRANSFERENCIA_LABEL: Record<string, string> = {
  transfere_filtro: 'Filtro',
  transfere_automacao: 'Automação',
};

interface TransferenciasContentProps {
  transferencias: TransferenciaDepartamento[];
  empresaId: string;
}

export function TransferenciasContent({
  transferencias: initialTransferencias,
  empresaId,
}: TransferenciasContentProps) {
  const { toast } = useToast();
  const [transferencias, setTransferencias] = useState<TransferenciaDepartamento[]>(initialTransferencias);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<TransferenciaDepartamento | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

  const handleSuccess = (saved: TransferenciaDepartamento) => {
    setTransferencias((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved].sort((a, b) => a.departamento.localeCompare(b.departamento));
    });
    setEditando(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta transferência? Regras de reativação vinculadas podem ser afetadas.')) return;
    setDeletando(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('empresa_upchat_transferencias_departamentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTransferencias((prev) => prev.filter((t) => t.id !== id));
      toast({ title: 'Transferência excluída.' });
    } catch {
      toast({ title: 'Erro ao excluir.', variant: 'destructive' });
    } finally {
      setDeletando(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transferências de Departamentos
          </CardTitle>
          <CardDescription>
            Regras de transferência de atendimento entre departamentos no UpChat.
          </CardDescription>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => { setEditando(null); setFormOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Nova Transferência
        </Button>
      </CardHeader>

      <CardContent>
        {transferencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ArrowRightLeft className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma transferência cadastrada. Clique em &quot;Nova Transferência&quot; para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transferencias.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3',
                  !item.ativo && 'opacity-50'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {item.departamento}
                    </span>

                    <Badge variant={item.ativo ? 'success' : 'secondary'}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>

                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {item.tipo_transferencia_upchat === 'transfere_filtro' ? (
                        <Filter className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      {TIPO_TRANSFERENCIA_LABEL[item.tipo_transferencia_upchat] ?? item.tipo_transferencia_upchat}
                    </span>

                    {item.registro_sistema && (
                      <Badge variant="outline" className="text-[10px]">Sistema</Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.descricao_conversa_para_ia}
                  </p>

                  {item.nome_setor_filtro && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Setor: {item.nome_setor_filtro}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setEditando(item); setFormOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10',
                      deletando === item.id && 'opacity-50 pointer-events-none'
                    )}
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <TransferenciaFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditando(null); }}
        empresaId={empresaId}
        transferencia={editando}
        onSuccess={handleSuccess}
      />
    </Card>
  );
}
