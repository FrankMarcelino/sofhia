'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Eye, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Documento, Dominio } from '@/lib/queries/neurocore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentosListProps {
  documentos: Documento[];
  dominios: Dominio[];
  empresaId: string | undefined;
  className?: string;
}

export function DocumentosList({ documentos: initialDocumentos, dominios, empresaId, className }: DocumentosListProps) {
  const { toast } = useToast();
  const [documentos, setDocumentos] = useState(initialDocumentos);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Documento | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    id_dominio: '',
  });

  const handleAdd = async () => {
    if (!empresaId || !formData.conteudo.trim()) {
      toast({
        title: 'Atenção',
        description: 'Preencha o conteúdo do documento.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('base_conhecimento_geral')
        .insert({
          id_empresa: empresaId,
          titulo: formData.titulo || null,
          conteudo: formData.conteudo,
          id_dominio: formData.id_dominio || null,
        })
        .select(`
          *,
          dominio:conhecimento_dominios(nome)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar documento:', error);
        toast({
          title: 'Erro ao criar',
          description: 'Não foi possível criar o documento. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setDocumentos([data, ...documentos]);
      setFormData({ titulo: '', conteudo: '', id_dominio: '' });
      setIsAdding(false);
      
      toast({
        title: 'Sucesso!',
        description: 'Documento adicionado com sucesso.',
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
    if (!confirm('Tem certeza que deseja deletar este documento?')) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('base_conhecimento_geral')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar documento:', error);
        toast({
          title: 'Erro ao deletar',
          description: 'Não foi possível deletar o documento. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      setDocumentos(documentos.filter(d => d.id !== id));
      if (viewingDoc?.id === id) {
        setViewingDoc(null);
      }
      
      toast({
        title: 'Sucesso!',
        description: 'Documento removido com sucesso.',
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

  if (viewingDoc) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewingDoc.titulo || 'Documento sem título'}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Adicionado {formatDistanceToNow(new Date(viewingDoc.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingDoc(null)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Fechar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">
              {viewingDoc.conteudo}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Conteúdo que alimenta a IA
          </p>
        </div>
        <Badge variant="info">{documentos.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Lista de documentos */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                'flex items-start justify-between p-3 rounded-lg border transition-colors',
                'hover:bg-muted/50 border-border'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {doc.titulo || 'Sem título'}
                  </p>
                  {doc.dominio && (
                    <Badge variant="outline" className="text-xs">
                      {doc.dominio.nome}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {doc.conteudo.substring(0, 100)}...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => setViewingDoc(doc)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {documentos.length === 0 && !isAdding && (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum documento adicionado ainda.
              </p>
            </div>
          )}
        </div>

        {/* Form de adicionar */}
        {isAdding ? (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Nome do documento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dominio">Domínio</Label>
                <select
                  id="dominio"
                  value={formData.id_dominio}
                  onChange={(e) => setFormData({ ...formData, id_dominio: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sem categoria</option>
                  {dominios.map((dominio) => (
                    <option key={dominio.id_dominio} value={dominio.id_dominio}>
                      {dominio.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo *</Label>
              <textarea
                id="conteudo"
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Cole ou digite o conteúdo do documento..."
                className="w-full min-h-[200px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Caracteres: {formData.conteudo.length}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={isLoading}
                size="sm"
                className="gap-2 flex-1"
              >
                <Save className="h-4 w-4" />
                Salvar Documento
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ titulo: '', conteudo: '', id_dominio: '' });
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
            Novo Documento
          </Button>
        )}

        {/* Dica */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            <strong>💡 Dica:</strong> Você pode colar FAQs, políticas, descrições de produtos ou qualquer conteúdo que a IA deve conhecer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
