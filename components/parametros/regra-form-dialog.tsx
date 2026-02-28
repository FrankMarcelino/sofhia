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
import type { RegraReativacao, Tag, Departamento } from '@/lib/queries/parametros';

const TIPO_ACAO_LABELS: Record<string, string> = {
  MENSAGEM: 'Enviar Mensagem',
  TRANSBORDAR: 'Transbordar para Humano',
  TRANSFERIR_DEPARTAMENTO: 'Transferir Departamento',
  TAG: 'Aplicar Tag',
};

interface RegraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  regra: RegraReativacao | null;
  proximaSequencia: number;
  tags: Tag[];
  departamentos: Departamento[];
  onSuccess: (regra: RegraReativacao) => void;
}

const EMPTY_FORM = {
  tempo_espera_minutos: 5,
  tipo_acao: 'MENSAGEM',
  mensagem_texto: '',
  id_tag: '',
  id_transferencia_departamento: '',
  tempo_inicio: '',
  tempo_fim: '',
  ativo: true,
};

export function RegraFormDialog({
  open,
  onOpenChange,
  empresaId,
  regra,
  proximaSequencia,
  tags,
  departamentos,
  onSuccess,
}: RegraFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const isEdit = !!regra;

  useEffect(() => {
    if (regra) {
      setForm({
        tempo_espera_minutos: regra.tempo_espera_minutos,
        tipo_acao: regra.tipo_acao,
        mensagem_texto: regra.mensagem_texto || '',
        id_tag: regra.id_tag || '',
        id_transferencia_departamento: regra.id_transferencia_departamento || '',
        tempo_inicio: regra.tempo_inicio || '',
        tempo_fim: regra.tempo_fim || '',
        ativo: regra.ativo,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [regra, open]);

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: typeof EMPTY_FORM[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      const payload = {
        tempo_espera_minutos: form.tempo_espera_minutos,
        tipo_acao: form.tipo_acao,
        mensagem_texto: form.mensagem_texto || null,
        id_tag: form.id_tag || null,
        id_transferencia_departamento: form.id_transferencia_departamento || null,
        tempo_inicio: form.tempo_inicio || null,
        tempo_fim: form.tempo_fim || null,
        ativo: form.ativo,
      };

      if (isEdit && regra) {
        const { data, error } = await supabase
          .from('regras_reativacao')
          .update(payload)
          .eq('id_regra', regra.id_regra)
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Regra atualizada com sucesso.' });
        onSuccess(data as RegraReativacao);
      } else {
        const { data, error } = await supabase
          .from('regras_reativacao')
          .insert({ ...payload, id_empresa: empresaId, sequencia: proximaSequencia })
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Regra criada com sucesso.' });
        onSuccess(data as RegraReativacao);
      }

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a regra. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showMensagem = form.tipo_acao === 'MENSAGEM' || form.tipo_acao === 'TRANSBORDAR';
  const showDepartamento = form.tipo_acao === 'TRANSFERIR_DEPARTAMENTO';
  const showTag = form.tipo_acao === 'TAG';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Regra' : 'Nova Regra de Reativação'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tempo de espera */}
          <div className="space-y-2">
            <Label htmlFor="tempo">Tempo de espera (minutos)</Label>
            <Input
              id="tempo"
              type="number"
              min={0}
              value={form.tempo_espera_minutos}
              onChange={(e) => set('tempo_espera_minutos', Number(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Tempo após inatividade do cliente para disparar esta ação.
            </p>
          </div>

          {/* Tipo de ação */}
          <div className="space-y-2">
            <Label htmlFor="tipo_acao">Ação</Label>
            <select
              id="tipo_acao"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.tipo_acao}
              onChange={(e) => set('tipo_acao', e.target.value)}
            >
              {Object.entries(TIPO_ACAO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Mensagem (MENSAGEM ou TRANSBORDAR) */}
          {showMensagem && (
            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                placeholder="Digite a mensagem a ser enviada..."
                rows={3}
                value={form.mensagem_texto}
                onChange={(e) => set('mensagem_texto', e.target.value)}
              />
            </div>
          )}

          {/* Tag */}
          {showTag && tags.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="id_tag">Tag</Label>
              <select
                id="id_tag"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.id_tag}
                onChange={(e) => set('id_tag', e.target.value)}
              >
                <option value="">Selecione uma tag...</option>
                {tags.map((t) => (
                  <option key={t.id_tag} value={t.id_tag}>{t.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* Departamento */}
          {showDepartamento && departamentos.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <select
                id="departamento"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.id_transferencia_departamento}
                onChange={(e) => set('id_transferencia_departamento', e.target.value)}
              >
                <option value="">Selecione um departamento...</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.descricao_conversa_para_ia}</option>
                ))}
              </select>
            </div>
          )}

          {/* Janela de horário */}
          <div className="space-y-2">
            <Label>Janela de horário <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tempo_inicio" className="text-xs text-muted-foreground">De</Label>
                <Input
                  id="tempo_inicio"
                  type="time"
                  value={form.tempo_inicio}
                  onChange={(e) => set('tempo_inicio', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tempo_fim" className="text-xs text-muted-foreground">Até</Label>
                <Input
                  id="tempo_fim"
                  type="time"
                  value={form.tempo_fim}
                  onChange={(e) => set('tempo_fim', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para disparar em qualquer horário.
            </p>
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Regra ativa</p>
              <p className="text-xs text-muted-foreground">Desative para pausar sem excluir.</p>
            </div>
            <Switch
              checked={form.ativo}
              onCheckedChange={(v) => set('ativo', v)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Regra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
