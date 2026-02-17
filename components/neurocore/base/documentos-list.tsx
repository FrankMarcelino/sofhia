'use client';

import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { DocumentoFormDialog } from './documento-form-dialog';
import type { Documento, Dominio } from '@/lib/queries/neurocore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  RASCUNHO: { label: 'Rascunho', variant: 'warning' as const },
  PUBLICADO: { label: 'Publicado', variant: 'success' as const },
  ARQUIVADO: { label: 'Arquivado', variant: 'secondary' as const },
};

interface DocumentosListProps {
  documentos: Documento[];
  dominios: Dominio[];
  empresaId: string;
  selectedDominioId: string | null;
  onDocumentosChange: (documentos: Documento[]) => void;
  className?: string;
}

export function DocumentosList({
  documentos,
  dominios,
  empresaId,
  selectedDominioId,
  onDocumentosChange,
  className,
}: DocumentosListProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDocumentos = useMemo(() => {
    if (!selectedDominioId) return documentos;
    return documentos.filter((d) => d.id_dominio === selectedDominioId);
  }, [documentos, selectedDominioId]);

  const handleSaved = (doc: Documento) => {
    if (editingDoc) {
      onDocumentosChange(documentos.map((d) => (d.id === doc.id ? doc : d)));
    } else {
      onDocumentosChange([doc, ...documentos]);
    }
    setEditingDoc(null);
  };

  const handleEdit = (doc: Documento) => {
    setEditingDoc(doc);
    setDialogOpen(true);
  };

  const handleNewClick = () => {
    setEditingDoc(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('base_conhecimento_geral')
        .delete()
        .eq('id', id);

      if (error) {
        toast({ title: 'Erro ao deletar', description: 'Não foi possível deletar o documento.', variant: 'destructive' });
        return;
      }

      onDocumentosChange(documentos.filter((d) => d.id !== id));
      toast({ title: 'Sucesso!', description: 'Documento removido.' });
    } catch {
      toast({ title: 'Erro inesperado', description: 'Ocorreu um erro. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (doc: Documento, newStatus: 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO') => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('base_conhecimento_geral')
        .update({ status_publicacao: newStatus })
        .eq('id', doc.id);

      if (error) {
        toast({ title: 'Erro ao atualizar status', description: 'Tente novamente.', variant: 'destructive' });
        return;
      }

      onDocumentosChange(
        documentos.map((d) => (d.id === doc.id ? { ...d, status_publicacao: newStatus } : d))
      );
      toast({ title: 'Status atualizado', description: `Documento agora está como ${STATUS_CONFIG[newStatus].label}.` });
    } catch {
      toast({ title: 'Erro inesperado', description: 'Ocorreu um erro.', variant: 'destructive' });
    }
  };

  const selectedDominioNome = selectedDominioId
    ? dominios.find((d) => d.id_dominio === selectedDominioId)?.nome
    : null;

  return (
    <>
      <Card className={cn('shadow-sm', className)}>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
              {selectedDominioNome && (
                <span className="text-sm font-normal text-muted-foreground">
                  &mdash; {selectedDominioNome}
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Conteúdo que alimenta a IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">{filteredDocumentos.length}</Badge>
            <Button size="sm" onClick={handleNewClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredDocumentos.map((doc) => {
              const statusCfg = STATUS_CONFIG[doc.status_publicacao] || STATUS_CONFIG.RASCUNHO;
              return (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.titulo}
                      </p>
                      {doc.dominio && (
                        <Badge variant="outline" className="text-xs">
                          {doc.dominio.nome}
                        </Badge>
                      )}
                      <Badge variant={statusCfg.variant} className="text-xs">
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {doc.conteudo.substring(0, 120)}
                      {doc.conteudo.length > 120 ? '...' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <Select
                      value={doc.status_publicacao}
                      onValueChange={(value) =>
                        handleStatusChange(doc, value as 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO')
                      }
                    >
                      <SelectTrigger className="h-7 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                        <SelectItem value="PUBLICADO">Publicado</SelectItem>
                        <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => handleEdit(doc)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredDocumentos.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {selectedDominioId
                    ? 'Nenhum documento neste domínio.'
                    : 'Nenhum documento adicionado ainda.'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em &quot;Novo Documento&quot; para adicionar.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Dica:</strong> Você pode colar FAQs, políticas, descrições de produtos ou qualquer conteúdo que a IA deve conhecer.
            </p>
          </div>
        </CardContent>
      </Card>

      <DocumentoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        documento={editingDoc}
        dominios={dominios}
        empresaId={empresaId}
        defaultDominioId={selectedDominioId || undefined}
        onSaved={handleSaved}
      />

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este documento? Esta ação não pode ser desfeita.
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
