'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa</Label>
              <Input
                id="nome"
                defaultValue={empresa.nome}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                defaultValue={empresa.cnpj || ''}
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
                defaultValue={empresa.email || ''}
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                defaultValue={empresa.telefone || ''}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                defaultValue={empresa.endereco || ''}
                placeholder="Rua, número"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                defaultValue={empresa.cidade || ''}
                placeholder="Cidade - UF"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                defaultValue={empresa.site || ''}
                placeholder="https://www.empresa.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                defaultValue={empresa.instagram || ''}
                placeholder="@empresa"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
