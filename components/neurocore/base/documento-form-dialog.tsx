'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Documento, Dominio } from '@/lib/queries/neurocore';

interface DocumentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento?: Documento | null;
  dominios: Dominio[];
  empresaId: string;
  defaultDominioId?: string;
  onSaved: (documento: Documento) => void;
}

function isValidImageUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function DocumentoFormDialog({
  open,
  onOpenChange,
  documento,
  dominios,
  empresaId,
  defaultDominioId,
  onSaved,
}: DocumentoFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    id_dominio: '',
    status_publicacao: 'RASCUNHO' as 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO',
    url_imagem: '',
  });

  const isEditing = !!documento;

  useEffect(() => {
    if (open) {
      if (documento) {
        setFormData({
          titulo: documento.titulo,
          conteudo: documento.conteudo,
          id_dominio: documento.id_dominio,
          status_publicacao: documento.status_publicacao,
          url_imagem: documento.url_imagem || '',
        });
      } else {
        setFormData({
          titulo: '',
          conteudo: '',
          id_dominio: defaultDominioId || '',
          status_publicacao: 'RASCUNHO',
          url_imagem: '',
        });
      }
    }
  }, [open, documento, defaultDominioId]);

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      toast({ title: 'Atenção', description: 'Preencha o título do documento.', variant: 'destructive' });
      return;
    }
    if (!formData.id_dominio) {
      toast({ title: 'Atenção', description: 'Selecione um domínio.', variant: 'destructive' });
      return;
    }
    if (!formData.conteudo.trim()) {
      toast({ title: 'Atenção', description: 'Preencha o conteúdo do documento.', variant: 'destructive' });
      return;
    }
    if (formData.url_imagem && !isValidImageUrl(formData.url_imagem)) {
      toast({ title: 'Atenção', description: 'A URL da imagem deve usar HTTPS.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const payload = {
        titulo: formData.titulo.trim(),
        conteudo: formData.conteudo.trim(),
        id_dominio: formData.id_dominio,
        status_publicacao: formData.status_publicacao,
        url_imagem: formData.url_imagem.trim() || null,
      };

      if (isEditing) {
        const { data, error } = await supabase
          .from('base_conhecimento_geral')
          .update(payload)
          .eq('id', documento.id)
          .select(`*, dominio:conhecimento_dominios(nome)`)
          .single();

        if (error) {
          toast({ title: 'Erro ao atualizar', description: 'Não foi possível atualizar o documento.', variant: 'destructive' });
          return;
        }

        onSaved(data);
        toast({ title: 'Sucesso!', description: 'Documento atualizado.' });
      } else {
        const { data, error } = await supabase
          .from('base_conhecimento_geral')
          .insert({ ...payload, id_empresa: empresaId })
          .select(`*, dominio:conhecimento_dominios(nome)`)
          .single();

        if (error) {
          toast({ title: 'Erro ao criar', description: 'Não foi possível criar o documento.', variant: 'destructive' });
          return;
        }

        onSaved(data);
        toast({ title: 'Sucesso!', description: 'Documento criado.' });
      }

      onOpenChange(false);
    } catch {
      toast({ title: 'Erro inesperado', description: 'Ocorreu um erro. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Documento' : 'Novo Documento'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações do documento.' : 'Preencha os campos para criar um novo documento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doc-titulo">Título *</Label>
            <Input
              id="doc-titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Nome do documento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Domínio *</Label>
              <Select
                value={formData.id_dominio}
                onValueChange={(value) => setFormData({ ...formData, id_dominio: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um domínio" />
                </SelectTrigger>
                <SelectContent>
                  {dominios.map((d) => (
                    <SelectItem key={d.id_dominio} value={d.id_dominio}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status_publicacao}
                onValueChange={(value) =>
                  setFormData({ ...formData, status_publicacao: value as 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="PUBLICADO">Publicado</SelectItem>
                  <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-conteudo">Conteúdo *</Label>
            <textarea
              id="doc-conteudo"
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              placeholder="Cole ou digite o conteúdo do documento..."
              className="w-full min-h-[200px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Caracteres: {formData.conteudo.length}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-url-imagem">URL da Imagem (opcional)</Label>
            <Input
              id="doc-url-imagem"
              value={formData.url_imagem}
              onChange={(e) => setFormData({ ...formData, url_imagem: e.target.value })}
              placeholder="https://exemplo.com/imagem.png"
            />
            <p className="text-xs text-muted-foreground">Apenas URLs HTTPS são aceitas.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
