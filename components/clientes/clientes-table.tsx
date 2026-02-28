'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Pencil,
  Trash2,
  UserCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ClienteFormDialog } from './cliente-form-dialog';
import type { Pessoa } from '@/lib/queries/clientes';
import { cn } from '@/lib/utils';

interface ClientesTableProps {
  clientes: Pessoa[];
  empresaId: string;
  total: number;
}

export function ClientesTable({ clientes: initial, empresaId }: ClientesTableProps) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Pessoa[]>(initial);
  const [busca, setBusca] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Pessoa | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

  const filtrados = clientes.filter((c) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(q) ||
      c.telefone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.cidade?.toLowerCase().includes(q)
    );
  });

  const handleSuccess = (saved: Pessoa) => {
    setClientes((prev) => {
      const idx = prev.findIndex((c) => c.id_pessoa === saved.id_pessoa);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setClienteEditando(null);
  };

  const handleEdit = (cliente: Pessoa) => {
    setClienteEditando(cliente);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return;

    setDeletando(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('pessoas').delete().eq('id_pessoa', id);

      if (error) throw error;

      setClientes((prev) => prev.filter((c) => c.id_pessoa !== id));
      toast({ title: 'Cliente excluído com sucesso.' });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o cliente.',
        variant: 'destructive',
      });
    } finally {
      setDeletando(null);
    }
  };

  const formatLocation = (c: Pessoa) => {
    const parts = [c.cidade, c.estado].filter(Boolean);
    return parts.length ? parts.join(' - ') : null;
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <Button
          onClick={() => {
            setClienteEditando(null);
            setFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Resultado */}
      <div className="mb-3 text-sm text-muted-foreground">
        {busca
          ? `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`
          : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} cadastrado${clientes.length !== 1 ? 's' : ''}`}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-semibold text-foreground mb-1">
              {busca ? 'Nenhum cliente encontrado' : 'Sem clientes ainda'}
            </p>
            <p className="text-sm text-muted-foreground">
              {busca
                ? 'Tente ajustar sua busca.'
                : 'Clique em "Novo Cliente" para cadastrar o primeiro.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((cliente) => (
            <Card
              key={cliente.id_pessoa}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar + Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate">
                          {cliente.nome || (
                            <span className="text-muted-foreground italic">Sem nome</span>
                          )}
                        </span>
                        {cliente.cnpj && (
                          <Badge variant="outline" className="text-xs">PJ</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        {cliente.telefone && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {cliente.telefone}
                          </span>
                        )}
                        {cliente.email && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                            <Mail className="h-3.5 w-3.5" />
                            {cliente.email}
                          </span>
                        )}
                        {formatLocation(cliente) && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {formatLocation(cliente)}
                          </span>
                        )}
                      </div>

                      {cliente.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                          {cliente.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(cliente)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10',
                        deletando === cliente.id_pessoa && 'opacity-50 pointer-events-none'
                      )}
                      onClick={() => handleDelete(cliente.id_pessoa)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário */}
      <ClienteFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setClienteEditando(null);
        }}
        empresaId={empresaId}
        cliente={clienteEditando}
        onSuccess={handleSuccess}
      />
    </>
  );
}
