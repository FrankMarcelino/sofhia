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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Cobertura, TipoCobertura } from '@/lib/types/cobertura';
import { inferirTipoCobertura, TIPOS_COBERTURA_LABEL } from '@/lib/types/cobertura';

interface CoberturaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cobertura?: Cobertura | null;
  empresaId: string;
  onSaved: (cobertura: Cobertura) => void;
}

const ALL_LOCATION_FIELDS = [
  'cep', 'cep_inicio', 'cep_fim', 'bairro', 'cidade', 'estado',
  'logradouro', 'numero_inicio', 'numero_fim', 'observacoes',
] as const;

const CAMPOS_POR_TIPO: Record<TipoCobertura, readonly string[]> = {
  faixa_cep: ['cep_inicio', 'cep_fim', 'observacoes'],
  logradouro: ['logradouro', 'numero_inicio', 'numero_fim', 'bairro', 'cidade', 'estado', 'observacoes'],
  bairro: ['bairro', 'cidade', 'estado', 'observacoes'],
  cidade: ['cidade', 'estado', 'observacoes'],
  estado: ['estado', 'observacoes'],
};

const OBRIGATORIOS_POR_TIPO: Record<TipoCobertura, readonly string[]> = {
  faixa_cep: ['cep_inicio', 'cep_fim'],
  logradouro: ['logradouro'],
  bairro: ['bairro', 'cidade'],
  cidade: ['cidade', 'estado'],
  estado: ['estado'],
};

type FormFields = {
  cep_inicio: string;
  cep_fim: string;
  logradouro: string;
  numero_inicio: string;
  numero_fim: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
  status_disponibilidade: boolean;
};

const EMPTY_FORM: FormFields = {
  cep_inicio: '',
  cep_fim: '',
  logradouro: '',
  numero_inicio: '',
  numero_fim: '',
  bairro: '',
  cidade: '',
  estado: '',
  observacoes: '',
  status_disponibilidade: true,
};

const FIELD_CONFIG: Record<string, { label: string; placeholder: string }> = {
  cep_inicio: { label: 'CEP Início', placeholder: '00000-000' },
  cep_fim: { label: 'CEP Fim', placeholder: '99999-999' },
  logradouro: { label: 'Logradouro', placeholder: 'Rua, Av, Travessa...' },
  numero_inicio: { label: 'Nº Início', placeholder: '1' },
  numero_fim: { label: 'Nº Fim', placeholder: '999' },
  bairro: { label: 'Bairro', placeholder: 'Nome do bairro' },
  cidade: { label: 'Cidade', placeholder: 'Nome da cidade' },
  estado: { label: 'Estado', placeholder: 'UF' },
};

export function CoberturaFormDialog({
  open,
  onOpenChange,
  cobertura,
  empresaId,
  onSaved,
}: CoberturaFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tipo, setTipo] = useState<TipoCobertura>('bairro');
  const [formData, setFormData] = useState<FormFields>({ ...EMPTY_FORM });

  const isEditing = !!cobertura;

  useEffect(() => {
    if (open) {
      if (cobertura) {
        const inferido = inferirTipoCobertura(cobertura);
        setTipo(inferido);
        setFormData({
          cep_inicio: cobertura.cep_inicio || '',
          cep_fim: cobertura.cep_fim || '',
          logradouro: cobertura.logradouro || '',
          numero_inicio: cobertura.numero_inicio || '',
          numero_fim: cobertura.numero_fim || '',
          bairro: cobertura.bairro || '',
          cidade: cobertura.cidade || '',
          estado: cobertura.estado || '',
          observacoes: cobertura.observacoes || '',
          status_disponibilidade: cobertura.status_disponibilidade,
        });
      } else {
        setTipo('bairro');
        setFormData({ ...EMPTY_FORM });
      }
    }
  }, [open, cobertura]);

  const handleSave = async () => {
    const obrigatorios = OBRIGATORIOS_POR_TIPO[tipo];
    const camposFaltando = obrigatorios.filter(
      (campo) => !formData[campo as keyof FormFields]?.toString().trim()
    );

    if (camposFaltando.length > 0) {
      const labels = camposFaltando.map((c) => FIELD_CONFIG[c]?.label || c).join(', ');
      toast({
        title: 'Campos obrigatórios',
        description: `Preencha: ${labels}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const camposDoTipo = CAMPOS_POR_TIPO[tipo];

      const payload: Record<string, string | boolean | null> = {
        status_disponibilidade: formData.status_disponibilidade,
      };

      for (const field of ALL_LOCATION_FIELDS) {
        if (camposDoTipo.includes(field)) {
          const value = formData[field as keyof FormFields];
          payload[field] = typeof value === 'string' && value.trim() ? value.trim() : null;
        } else {
          payload[field] = null;
        }
      }

      if (isEditing) {
        const { data, error } = await supabase
          .from('conhecimento_cobertura')
          .update(payload)
          .eq('id', cobertura.id)
          .select('*')
          .single();

        if (error) {
          toast({ title: 'Erro ao atualizar', description: 'Não foi possível atualizar a cobertura.', variant: 'destructive' });
          return;
        }

        onSaved(data);
        toast({ title: 'Sucesso!', description: 'Área de cobertura atualizada.' });
      } else {
        const { data, error } = await supabase
          .from('conhecimento_cobertura')
          .insert({ ...payload, id_empresa: empresaId })
          .select('*')
          .single();

        if (error) {
          toast({ title: 'Erro ao criar', description: 'Não foi possível criar a área de cobertura.', variant: 'destructive' });
          return;
        }

        onSaved(data);
        toast({ title: 'Sucesso!', description: 'Área de cobertura criada.' });
      }

      onOpenChange(false);
    } catch {
      toast({ title: 'Erro inesperado', description: 'Ocorreu um erro. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const camposVisiveis = CAMPOS_POR_TIPO[tipo].filter((c) => c !== 'observacoes');
  const obrigatorios = OBRIGATORIOS_POR_TIPO[tipo];

  const isHalfWidth = (campo: string) => {
    return ['cep_inicio', 'cep_fim', 'numero_inicio', 'numero_fim'].includes(campo);
  };

  const renderCampos = () => {
    const campos = camposVisiveis;
    const rows: string[][] = [];
    let i = 0;

    while (i < campos.length) {
      const campo = campos[i];
      if (isHalfWidth(campo) && i + 1 < campos.length && isHalfWidth(campos[i + 1])) {
        rows.push([campo, campos[i + 1]]);
        i += 2;
      } else {
        rows.push([campo]);
        i++;
      }
    }

    return rows.map((row) => (
      <div key={row.join('-')} className={row.length === 2 ? 'grid grid-cols-2 gap-3' : ''}>
        {row.map((campo) => {
          const config = FIELD_CONFIG[campo];
          const isRequired = obrigatorios.includes(campo);
          return (
            <div key={campo} className="space-y-2">
              <Label htmlFor={`cob-${campo}`}>
                {config.label}{isRequired ? ' *' : ''}
              </Label>
              <Input
                id={`cob-${campo}`}
                value={formData[campo as keyof FormFields] as string}
                onChange={(e) => setFormData({ ...formData, [campo]: e.target.value })}
                placeholder={config.placeholder}
              />
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cobertura' : 'Nova Área de Cobertura'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados da área de cobertura.' : 'Selecione o tipo e preencha os campos.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de cobertura</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCobertura)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TIPOS_COBERTURA_LABEL) as [TipoCobertura, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {renderCampos()}

          <div className="space-y-2">
            <Label htmlFor="cob-observacoes">Observações</Label>
            <Textarea
              id="cob-observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre esta área..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div>
              <Label htmlFor="cob-disponibilidade" className="text-sm font-medium">
                Disponível
              </Label>
              <p className="text-xs text-muted-foreground">
                Área disponível para atendimento
              </p>
            </div>
            <Switch
              id="cob-disponibilidade"
              checked={formData.status_disponibilidade}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, status_disponibilidade: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Cobertura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
