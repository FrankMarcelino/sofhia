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
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Extracao } from '@/lib/queries/neurocore';

const TIPOS_DADO: { value: Extracao['tipo_dado']; label: string }[] = [
  { value: 'string', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'date', label: 'Data' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
];

interface ExtracaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agenteId: string;
  extracao: Extracao | null;
  onSuccess: (extracao: Extracao) => void;
}

const EMPTY_FORM = {
  informacao_para_extrair: '',
  descricao_para_ia: '',
  tipo_dado: 'string' as Extracao['tipo_dado'],
};

export function ExtracaoFormDialog({
  open,
  onOpenChange,
  agenteId,
  extracao,
  onSuccess,
}: ExtracaoFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const isEdit = !!extracao;

  useEffect(() => {
    if (extracao) {
      setForm({
        informacao_para_extrair: extracao.informacao_para_extrair,
        descricao_para_ia: extracao.descricao_para_ia,
        tipo_dado: extracao.tipo_dado,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [extracao, open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const payload = {
        informacao_para_extrair: form.informacao_para_extrair,
        descricao_para_ia: form.descricao_para_ia,
        tipo_dado: form.tipo_dado,
      };

      if (isEdit && extracao) {
        const { data, error } = await supabase
          .from('agente_extracoes')
          .update(payload)
          .eq('id_agente_extracoes', extracao.id_agente_extracoes)
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Extração atualizada com sucesso.' });
        onSuccess(data as Extracao);
      } else {
        const { data, error } = await supabase
          .from('agente_extracoes')
          .insert({ ...payload, id_agente: agenteId })
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Extração criada com sucesso.' });
        onSuccess(data as Extracao);
      }

      onOpenChange(false);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Extração' : 'Nova Extração'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          {/* Campo + Tipo */}
          <div className="grid grid-cols-[1fr_160px] gap-3">
            <div className="space-y-2">
              <Label htmlFor="info">Campo a Extrair</Label>
              <Input
                id="info"
                placeholder="Ex: Nome Completo, CPF..."
                value={form.informacao_para_extrair}
                onChange={(e) => setForm((p) => ({ ...p, informacao_para_extrair: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Dado</Label>
              <select
                id="tipo"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.tipo_dado}
                onChange={(e) => setForm((p) => ({ ...p, tipo_dado: e.target.value as Extracao['tipo_dado'] }))}
              >
                {TIPOS_DADO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="desc">
              Instrução para a IA{' '}
              <span className="text-muted-foreground font-normal">(como coletar este dado)</span>
            </Label>
            <Textarea
              id="desc"
              placeholder="Ex: Pergunte o nome completo e certifique-se que tem nome e sobrenome..."
              rows={3}
              value={form.descricao_para_ia}
              onChange={(e) => setForm((p) => ({ ...p, descricao_para_ia: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Extração'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
