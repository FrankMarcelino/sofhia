'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { TagCompleta } from '@/lib/queries/parametros';

const TAG_TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: 'sucesso', label: 'Sucesso' },
  { value: 'descricao', label: 'Descrição' },
  { value: 'falha', label: 'Falha' },
  { value: 'outros', label: 'Outros' },
];

const CONVERSA_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ia_conversando', label: 'IA Conversando' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'aguardando_humano', label: 'Aguardando Humano' },
  { value: 'encerrado', label: 'Encerrado' },
];

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  tag: TagCompleta | null;
  onSuccess: (tag: TagCompleta) => void;
}

const EMPTY_FORM = {
  nome: '',
  cor_hex: '#6366f1',
  tag_tipo: TAG_TIPO_OPTIONS[0].value,
  descricao_para_ia: '',
  mudar_status_conversa_para: '',
  enviar_mensagem_texto: false,
  mensagem_texto: '',
};

export function TagFormDialog({
  open,
  onOpenChange,
  empresaId,
  tag,
  onSuccess,
}: TagFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const isEdit = !!tag;

  useEffect(() => {
    if (tag) {
      setForm({
        nome: tag.nome,
        cor_hex: tag.cor_hex || '#6366f1',
        tag_tipo: tag.tag_tipo,
        descricao_para_ia: tag.descricao_para_ia || '',
        mudar_status_conversa_para: tag.mudar_status_conversa_para || '',
        enviar_mensagem_texto: tag.enviar_mensagem_texto,
        mensagem_texto: tag.mensagem_texto || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [tag, open]);

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: typeof EMPTY_FORM[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      const payload = {
        nome: form.nome,
        cor_hex: form.cor_hex,
        tag_tipo: form.tag_tipo,
        descricao_para_ia: form.descricao_para_ia || null,
        mudar_status_conversa_para: form.mudar_status_conversa_para || null,
        enviar_mensagem_texto: form.enviar_mensagem_texto,
        mensagem_texto: form.enviar_mensagem_texto ? (form.mensagem_texto || null) : null,
      };

      if (isEdit && tag) {
        const { data, error } = await supabase
          .from('tags')
          .update(payload)
          .eq('id_tag', tag.id_tag)
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Tag atualizada com sucesso.' });
        onSuccess(data as TagCompleta);
      } else {
        const { data, error } = await supabase
          .from('tags')
          .insert({ ...payload, id_empresa: empresaId })
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Tag criada com sucesso.' });
        onSuccess(data as TagCompleta);
      }

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a tag. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          {/* Nome + Cor */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Nome da tag"
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cor">Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  id="cor"
                  type="color"
                  value={form.cor_hex}
                  onChange={(e) => set('cor_hex', e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-input p-1"
                />
              </div>
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tag_tipo">Tipo</Label>
            <select
              id="tag_tipo"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.tag_tipo}
              onChange={(e) => set('tag_tipo', e.target.value)}
            >
              {TAG_TIPO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Descrição para IA */}
          <div className="space-y-2">
            <Label htmlFor="descricao_ia">
              Descrição para IA{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="descricao_ia"
              placeholder="Explique à IA quando aplicar esta tag..."
              rows={2}
              value={form.descricao_para_ia}
              onChange={(e) => set('descricao_para_ia', e.target.value)}
            />
          </div>

          {/* Mudar status da conversa */}
          <div className="space-y-2">
            <Label htmlFor="mudar_status">
              Mudar status da conversa para{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <select
              id="mudar_status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.mudar_status_conversa_para}
              onChange={(e) => set('mudar_status_conversa_para', e.target.value)}
            >
              <option value="">Não alterar</option>
              {CONVERSA_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Enviar mensagem automática */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Enviar mensagem automática</p>
                <p className="text-xs text-muted-foreground">
                  Envia uma mensagem ao cliente quando esta tag for aplicada.
                </p>
              </div>
              <Switch
                checked={form.enviar_mensagem_texto}
                onCheckedChange={(v) => set('enviar_mensagem_texto', v)}
              />
            </div>

            {form.enviar_mensagem_texto && (
              <div className="space-y-2">
                <Label htmlFor="mensagem_texto">Mensagem</Label>
                <Textarea
                  id="mensagem_texto"
                  placeholder="Digite a mensagem a ser enviada..."
                  rows={3}
                  value={form.mensagem_texto}
                  onChange={(e) => set('mensagem_texto', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Tag'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
