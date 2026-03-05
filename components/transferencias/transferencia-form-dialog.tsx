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
import type { TransferenciaDepartamento } from '@/lib/queries/transferencias';

// TODO: substituir pelos valores reais do enum do banco
const DEPARTAMENTO_OPTIONS: { value: string; label: string }[] = [
  { value: 'VENDAS', label: 'Vendas' },
  { value: 'SUPORTE', label: 'Suporte' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'CANCELAMENTO', label: 'Cancelamento' },
  { value: 'OUTROS', label: 'Outros' },
];

// TODO: substituir pelos valores reais do enum do banco
const TIPO_TRANSFERENCIA_OPTIONS: { value: string; label: string }[] = [
  { value: 'transfere_filtro', label: 'Transferir por Filtro' },
  { value: 'transfere_automacao', label: 'Transferir por Automação' },
];

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface TransferenciaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  transferencia: TransferenciaDepartamento | null;
  onSuccess: (t: TransferenciaDepartamento) => void;
}

const EMPTY_FORM = {
  departamento: DEPARTAMENTO_OPTIONS[0].value,
  descricao_conversa_para_ia: '',
  tipo_transferencia_upchat: TIPO_TRANSFERENCIA_OPTIONS[0].value,
  nome_setor_filtro: '',
  url_transferencia_filtro: '',
  id_automacao_transferencia: '',
  url_transferencia_automacao: '',
  ativo: true,
  registro_sistema: false,
};

export function TransferenciaFormDialog({
  open,
  onOpenChange,
  empresaId,
  transferencia,
  onSuccess,
}: TransferenciaFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const isEdit = !!transferencia;

  useEffect(() => {
    if (transferencia) {
      setForm({
        departamento: transferencia.departamento,
        descricao_conversa_para_ia: transferencia.descricao_conversa_para_ia,
        tipo_transferencia_upchat: transferencia.tipo_transferencia_upchat,
        nome_setor_filtro: transferencia.nome_setor_filtro || '',
        url_transferencia_filtro: transferencia.url_transferencia_filtro || '',
        id_automacao_transferencia: transferencia.id_automacao_transferencia?.toString() || '',
        url_transferencia_automacao: transferencia.url_transferencia_automacao || '',
        ativo: transferencia.ativo,
        registro_sistema: transferencia.registro_sistema,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [transferencia, open]);

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isFiltro = form.tipo_transferencia_upchat === 'transfere_filtro';
  const isAutomacao = form.tipo_transferencia_upchat === 'transfere_automacao';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      const payload = {
        departamento: form.departamento,
        descricao_conversa_para_ia: form.descricao_conversa_para_ia,
        tipo_transferencia_upchat: form.tipo_transferencia_upchat,
        nome_setor_filtro: isFiltro ? (form.nome_setor_filtro || null) : null,
        url_transferencia_filtro: isFiltro ? (form.url_transferencia_filtro || null) : null,
        id_automacao_transferencia: isAutomacao && form.id_automacao_transferencia
          ? parseInt(form.id_automacao_transferencia, 10)
          : null,
        url_transferencia_automacao: isAutomacao ? (form.url_transferencia_automacao || null) : null,
        ativo: form.ativo,
        registro_sistema: form.registro_sistema,
      };

      if (isEdit && transferencia) {
        const { data, error } = await supabase
          .from('empresa_upchat_transferencias_departamentos')
          .update(payload)
          .eq('id', transferencia.id)
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Transferência atualizada com sucesso.' });
        onSuccess(data as TransferenciaDepartamento);
      } else {
        const { data, error } = await supabase
          .from('empresa_upchat_transferencias_departamentos')
          .insert({ ...payload, id_empresa: empresaId })
          .select()
          .single();

        if (error) throw error;
        toast({ title: 'Transferência criada com sucesso.' });
        onSuccess(data as TransferenciaDepartamento);
      }

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a transferência. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Transferência' : 'Nova Transferência'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="departamento">Departamento</Label>
            <select
              id="departamento"
              className={SELECT_CLASS}
              value={form.departamento}
              onChange={(e) => set('departamento', e.target.value)}
            >
              {DEPARTAMENTO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao_conversa_para_ia">Descrição para IA</Label>
            <Textarea
              id="descricao_conversa_para_ia"
              placeholder="Descreva quando a IA deve transferir para este departamento..."
              rows={3}
              value={form.descricao_conversa_para_ia}
              onChange={(e) => set('descricao_conversa_para_ia', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_transferencia">Tipo de Transferência</Label>
            <select
              id="tipo_transferencia"
              className={SELECT_CLASS}
              value={form.tipo_transferencia_upchat}
              onChange={(e) => set('tipo_transferencia_upchat', e.target.value)}
            >
              {TIPO_TRANSFERENCIA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {isFiltro && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome_setor_filtro">
                  Nome do Setor (Filtro){' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="nome_setor_filtro"
                  placeholder="Ex: Setor Vendas"
                  value={form.nome_setor_filtro}
                  onChange={(e) => set('nome_setor_filtro', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url_transferencia_filtro">
                  URL de Transferência (Filtro){' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="url_transferencia_filtro"
                  placeholder="https://..."
                  value={form.url_transferencia_filtro}
                  onChange={(e) => set('url_transferencia_filtro', e.target.value)}
                />
              </div>
            </>
          )}

          {isAutomacao && (
            <>
              <div className="space-y-2">
                <Label htmlFor="id_automacao_transferencia">
                  ID da Automação{' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="id_automacao_transferencia"
                  type="number"
                  placeholder="Ex: 12345"
                  value={form.id_automacao_transferencia}
                  onChange={(e) => set('id_automacao_transferencia', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url_transferencia_automacao">
                  URL de Transferência (Automação){' '}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="url_transferencia_automacao"
                  placeholder="https://..."
                  value={form.url_transferencia_automacao}
                  onChange={(e) => set('url_transferencia_automacao', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Ativo</p>
                <p className="text-xs text-muted-foreground">
                  Transferência disponível para uso pela IA e regras de reativação.
                </p>
              </div>
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => set('ativo', v)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Registro de sistema</p>
                <p className="text-xs text-muted-foreground">
                  Marcar como registro gerenciado pelo sistema (não editável pelo usuário).
                </p>
              </div>
              <Switch
                checked={form.registro_sistema}
                onCheckedChange={(v) => set('registro_sistema', v)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Transferência'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
