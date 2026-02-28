'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { TagFormDialog } from './tag-form-dialog';
import { Plus, Pencil, Trash2, Tag as TagIcon, MessageSquare, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TagCompleta } from '@/lib/queries/parametros';

const TIPO_LABEL: Record<string, string> = {
  sucesso: 'Sucesso',
  descricao: 'Descrição',
  falha: 'Falha',
  outros: 'Outros',
};

const STATUS_LABEL: Record<string, string> = {
  ia_conversando: 'IA Conversando',
  pausado: 'Pausado',
  aguardando_humano: 'Aguardando Humano',
  encerrado: 'Encerrado',
};

interface TagsContentProps {
  tags: TagCompleta[];
  empresaId: string;
}

export function TagsContent({ tags: initialTags, empresaId }: TagsContentProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState<TagCompleta[]>(initialTags);
  const [formOpen, setFormOpen] = useState(false);
  const [tagEditando, setTagEditando] = useState<TagCompleta | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

  const handleSuccess = (saved: TagCompleta) => {
    setTags((prev) => {
      const idx = prev.findIndex((t) => t.id_tag === saved.id_tag);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    setTagEditando(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta tag? Conversas que a utilizam podem ser afetadas.')) return;
    setDeletando(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tags').delete().eq('id_tag', id);
      if (error) throw error;
      setTags((prev) => prev.filter((t) => t.id_tag !== id));
      toast({ title: 'Tag excluída.' });
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
            <TagIcon className="h-4 w-4" />
            Tags
          </CardTitle>
          <CardDescription>
            Etiquetas aplicadas às conversas para classificação e automações.
          </CardDescription>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => { setTagEditando(null); setFormOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Nova Tag
        </Button>
      </CardHeader>

      <CardContent>
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <TagIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhuma tag cadastrada. Clique em &quot;Nova Tag&quot; para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id_tag}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                {/* Cor */}
                <div
                  className="h-4 w-4 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: tag.cor_hex }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{tag.nome}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                      {TIPO_LABEL[tag.tag_tipo] ?? tag.tag_tipo}
                    </span>

                    {tag.mudar_status_conversa_para && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ArrowRightLeft className="h-3 w-3" />
                        {STATUS_LABEL[tag.mudar_status_conversa_para] ?? tag.mudar_status_conversa_para}
                      </span>
                    )}

                    {tag.enviar_mensagem_texto && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        Mensagem automática
                      </span>
                    )}
                  </div>

                  {tag.descricao_para_ia && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {tag.descricao_para_ia}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setTagEditando(tag); setFormOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10',
                      deletando === tag.id_tag && 'opacity-50 pointer-events-none'
                    )}
                    onClick={() => handleDelete(tag.id_tag)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <TagFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setTagEditando(null); }}
        empresaId={empresaId}
        tag={tagEditando}
        onSuccess={handleSuccess}
      />
    </Card>
  );
}
