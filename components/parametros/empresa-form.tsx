'use client';

import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Empresa {
  id_empresa: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  telefone: string | null;
  site: string | null;
  instagram: string | null;
  email: string | null;
  status_empresa: 'ATIVO' | 'INATIVO' | 'SUSPENSO';
}

interface EmpresaFormProps {
  empresa: Empresa | null;
  className?: string;
}

const statusBadge: Record<string, 'success' | 'warning' | 'error'> = {
  ATIVO: 'success',
  INATIVO: 'warning',
  SUSPENSO: 'error',
};

export function EmpresaForm({ empresa, className }: EmpresaFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: empresa?.nome || '',
    cnpj: empresa?.cnpj || '',
    email: empresa?.email || '',
    telefone: empresa?.telefone || '',
    endereco: empresa?.endereco || '',
    cidade: empresa?.cidade || '',
    site: empresa?.site || '',
    instagram: empresa?.instagram || '',
  });

  if (!empresa) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Empresa não encontrada.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('empresa')
        .update({
          nome: formData.nome,
          cnpj: formData.cnpj || null,
          email: formData.email || null,
          telefone: formData.telefone || null,
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          site: formData.site || null,
          instagram: formData.instagram || null,
        })
        .eq('id_empresa', empresa.id_empresa);

      if (error) {
        console.error('Erro ao salvar empresa:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as alterações. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Dados da empresa atualizados com sucesso.',
      });
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao salvar. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>
            Informações básicas da sua empresa
          </CardDescription>
        </div>
        <Badge variant={statusBadge[empresa.status_empresa]}>
          {empresa.status_empresa}
        </Badge>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da empresa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, número"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Cidade - UF"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                value={formData.site}
                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                placeholder="https://www.empresa.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@empresa"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="gap-2" disabled={isLoading}>
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
