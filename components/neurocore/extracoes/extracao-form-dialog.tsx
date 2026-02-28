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

// ─── Enums reais do banco ─────────────────────────────────────────────────────

const TIPOS_DADO: { value: Extracao['tipo_dado']; label: string }[] = [
  { value: 'string',  label: 'Texto'    },
  { value: 'number',  label: 'Número'   },
  { value: 'boolean', label: 'Sim/Não'  },
  { value: 'date',    label: 'Data'     },
  { value: 'json',    label: 'JSON'     },
];

const CHAVES_NORMATIZADAS: { value: string; label: string }[] = [
  { value: 'nome_pessoa_fisica',   label: 'Nome (Pessoa Física)'   },
  { value: 'nome_pessoa_juridica', label: 'Nome (Pessoa Jurídica)' },
  { value: 'cpf',                  label: 'CPF'                    },
  { value: 'cnpj',                 label: 'CNPJ'                   },
  { value: 'rg',                   label: 'RG'                     },
  { value: 'email',                label: 'E-mail'                 },
  { value: 'telefone',             label: 'Telefone'               },
  { value: 'telefone_2',           label: 'Telefone 2'             },
  { value: 'data_nascimento',      label: 'Data de Nascimento'     },
  { value: 'cep',                  label: 'CEP'                    },
  { value: 'logradouro',           label: 'Logradouro'             },
  { value: 'numero_casa',          label: 'Número (casa/apto)'     },
  { value: 'bairro',               label: 'Bairro'                 },
  { value: 'cidade',               label: 'Cidade'                 },
  { value: 'estado',               label: 'Estado'                 },
  { value: 'pais',                 label: 'País'                   },
  { value: 'plano_escolhido',      label: 'Plano Escolhido'        },
  { value: 'valor_total',          label: 'Valor Total'            },
  { value: 'valor_mensalidade',    label: 'Valor Mensalidade'      },
  { value: 'dia_vencimento',       label: 'Dia de Vencimento'      },
  { value: 'servicos_adicionais',  label: 'Serviços Adicionais'    },
];

// ─── Props / estado ───────────────────────────────────────────────────────────

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
  tipo_chave_normatizada: '' as string,
};

// ─── Componente ───────────────────────────────────────────────────────────────

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
  const set = <K extends keyof typeof EMPTY_FORM>(k: K, v: typeof EMPTY_FORM[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (extracao) {
      setForm({
        informacao_para_extrair: extracao.informacao_para_extrair,
        descricao_para_ia:       extracao.descricao_para_ia,
        tipo_dado:               extracao.tipo_dado,
        tipo_chave_normatizada:  extracao.tipo_chave_normatizada ?? '',
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
        descricao_para_ia:       form.descricao_para_ia,
        tipo_dado:               form.tipo_dado,
        tipo_chave_normatizada:  form.tipo_chave_normatizada || null,
      };

      if (isEdit && extracao) {
        const { data, error } = await supabase
          .from('agente_extracoes')
          .update(payload)
          .eq('id_agente_extracoes', extracao.id_agente_extracoes)
          .select('id_agente_extracoes, informacao_para_extrair, descricao_para_ia, tipo_dado, tipo_chave_normatizada')
          .single();

        if (error) throw error;
        toast({ title: 'Extração atualizada com sucesso.' });
        onSuccess(data as Extracao);
      } else {
        const { data, error } = await supabase
          .from('agente_extracoes')
          .insert({ ...payload, id_agente: agenteId })
          .select('id_agente_extracoes, informacao_para_extrair, descricao_para_ia, tipo_dado, tipo_chave_normatizada')
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

          {/* Campo + Tipo de Dado */}
          <div className="grid grid-cols-[1fr_160px] gap-3">
            <div className="space-y-2">
              <Label htmlFor="info">Campo a Extrair</Label>
              <Input
                id="info"
                placeholder="Ex: Nome Completo, CPF..."
                value={form.informacao_para_extrair}
                onChange={(e) => set('informacao_para_extrair', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_dado">Tipo de Dado</Label>
              <select
                id="tipo_dado"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.tipo_dado}
                onChange={(e) => set('tipo_dado', e.target.value as Extracao['tipo_dado'])}
              >
                {TIPOS_DADO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chave Normatizada */}
          <div className="space-y-2">
            <Label htmlFor="chave">
              Ancoragem no perfil do cliente{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <select
              id="chave"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.tipo_chave_normatizada}
              onChange={(e) => set('tipo_chave_normatizada', e.target.value)}
            >
              <option value="">Não vincular ao perfil</option>
              {CHAVES_NORMATIZADAS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Quando preenchido, o dado extraído é sincronizado automaticamente com o perfil do cliente.
            </p>
          </div>

          {/* Instrução para IA */}
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
              onChange={(e) => set('descricao_para_ia', e.target.value)}
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
