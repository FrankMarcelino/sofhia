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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Cobertura } from '@/lib/queries/neurocore';

interface CoberturaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cobertura?: Cobertura | null;
  empresaId: string;
  onSaved: (cobertura: Cobertura) => void;
}

export function CoberturaFormDialog({
  open,
  onOpenChange,
  cobertura,
  empresaId,
  onSaved,
}: CoberturaFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cep: '',
    bairro: '',
    cidade: '',
    status_disponibilidade: true,
  });

  const isEditing = !!cobertura;

  useEffect(() => {
    if (open) {
      if (cobertura) {
        setFormData({
          cep: cobertura.cep || '',
          bairro: cobertura.bairro || '',
          cidade: cobertura.cidade || '',
          status_disponibilidade: cobertura.status_disponibilidade,
        });
      } else {
        setFormData({
          cep: '',
          bairro: '',
          cidade: '',
          status_disponibilidade: true,
        });
      }
    }
  }, [open, cobertura]);

  const handleSave = async () => {
    const hasLocation = formData.cep.trim() || formData.bairro.trim() || formData.cidade.trim();
    if (!hasLocation) {
      toast({
        title: 'Atenção',
        description: 'Preencha ao menos um campo de localização (CEP, bairro ou cidade).',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const payload = {
        cep: formData.cep.trim() || null,
        bairro: formData.bairro.trim() || null,
        cidade: formData.cidade.trim() || null,
        status_disponibilidade: formData.status_disponibilidade,
      };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cobertura' : 'Nova Área de Cobertura'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados da área de cobertura.' : 'Preencha ao menos um campo de localização.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cob-cep">CEP</Label>
            <Input
              id="cob-cep"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
              placeholder="00000-000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cob-bairro">Bairro</Label>
            <Input
              id="cob-bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Nome do bairro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cob-cidade">Cidade</Label>
            <Input
              id="cob-cidade"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="Nome da cidade"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div>
              <Label htmlFor="cob-disponibilidade" className="text-sm font-medium">
                Disponível
              </Label>
              <p className="text-xs text-muted-foreground">
                Indica se a área está disponível para atendimento
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
