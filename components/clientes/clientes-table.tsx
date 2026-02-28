'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  MessageSquare,
  Tag,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ClienteFormDialog } from './cliente-form-dialog';
import type { Pessoa, TagSimples, ConversaSimples } from '@/lib/queries/clientes';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABEL: Record<string, string> = {
  ia_conversando:    'Em conversa',
  pausado:           'Pausado',
  aguardando_humano: 'Aguardando humano',
  encerrado:         'Encerrado',
};

const STATUS_CLASS: Record<string, string> = {
  ia_conversando:    'bg-green-500/10 text-green-700 border-green-200',
  pausado:           'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  aguardando_humano: 'bg-orange-500/10 text-orange-700 border-orange-200',
  encerrado:         'bg-muted text-muted-foreground border-border',
};

function getTagsPessoa(pessoa: Pessoa): TagSimples[] {
  const map = new Map<string, TagSimples>();
  for (const conversa of (pessoa.conversas ?? [])) {
    for (const ct of (conversa.conversas_tags ?? [])) {
      if (ct.tags) map.set(ct.tags.id_tag, ct.tags);
    }
  }
  return Array.from(map.values());
}

interface ConversasDialogProps {
  pessoa: Pessoa | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function ConversasDialog({ pessoa, open, onOpenChange }: ConversasDialogProps) {
  if (!pessoa) return null;
  const conversas: ConversaSimples[] = [...(pessoa.conversas ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas — {pessoa.nome || 'Sem nome'}
          </DialogTitle>
        </DialogHeader>

        {conversas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {conversas.map((conv) => {
              const tags = (conv.conversas_tags ?? [])
                .map((ct) => ct.tags)
                .filter(Boolean) as TagSimples[];
              return (
                <div
                  key={conv.id_conversa}
                  className="flex items-start gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full border font-medium',
                          STATUS_CLASS[conv.status_conversa] ?? 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        {STATUS_LABEL[conv.status_conversa] ?? conv.status_conversa}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag.id_tag}
                            className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                            style={{ backgroundColor: tag.cor_hex || '#6b7280' }}
                          >
                            {tag.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ClientesTableProps {
  clientes: Pessoa[];
  empresaId: string;
  total: number;
  tags: TagSimples[];
}

export function ClientesTable({ clientes: initial, empresaId, tags }: ClientesTableProps) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Pessoa[]>(initial);
  const [busca, setBusca] = useState('');
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Pessoa | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);
  const [conversasPessoa, setConversasPessoa] = useState<Pessoa | null>(null);

  const filtrados = clientes.filter((c) => {
    if (busca) {
      const q = busca.toLowerCase();
      const match =
        c.nome?.toLowerCase().includes(q) ||
        c.telefone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.cidade?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (tagFiltro) {
      const tagsCliente = getTagsPessoa(c);
      if (!tagsCliente.some((t) => t.id_tag === tagFiltro)) return false;
    }
    return true;
  });

  const handleSuccess = (saved: Pessoa) => {
    setClientes((prev) => {
      const idx = prev.findIndex((c) => c.id_pessoa === saved.id_pessoa);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...saved, conversas: prev[idx].conversas };
        return next;
      }
      return [{ ...saved, conversas: [] }, ...prev];
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
      <div className="flex items-center justify-between gap-4 mb-4">
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

      {/* Filtro por tag */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Filtrar por tag:</span>
          {tags.map((tag) => (
            <button
              key={tag.id_tag}
              type="button"
              onClick={() => setTagFiltro(tagFiltro === tag.id_tag ? null : tag.id_tag)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
                tagFiltro === tag.id_tag
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-background hover:opacity-80 border-border text-foreground'
              )}
              style={tagFiltro === tag.id_tag ? { backgroundColor: tag.cor_hex || '#6b7280' } : undefined}
            >
              {tag.nome}
            </button>
          ))}
          {tagFiltro && (
            <button
              type="button"
              onClick={() => setTagFiltro(null)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Resultado */}
      <div className="mb-3 text-sm text-muted-foreground">
        {busca || tagFiltro
          ? `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`
          : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} cadastrado${clientes.length !== 1 ? 's' : ''}`}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-semibold text-foreground mb-1">
              {busca || tagFiltro ? 'Nenhum cliente encontrado' : 'Sem clientes ainda'}
            </p>
            <p className="text-sm text-muted-foreground">
              {busca || tagFiltro
                ? 'Tente ajustar sua busca ou filtro.'
                : 'Clique em "Novo Cliente" para cadastrar o primeiro.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((cliente) => {
            const tagsCliente = getTagsPessoa(cliente);
            const totalConversas = (cliente.conversas ?? []).length;

            return (
              <Card key={cliente.id_pessoa} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Avatar + Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserCircle className="h-6 w-6 text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Nome + PJ badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {cliente.nome || (
                              <span className="text-muted-foreground italic">Sem nome</span>
                            )}
                          </span>
                          {cliente.cnpj && (
                            <Badge variant="outline" className="text-xs">PJ</Badge>
                          )}
                        </div>

                        {/* Contatos */}
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

                        {/* Tags + contagem de conversas */}
                        {(tagsCliente.length > 0 || totalConversas > 0) && (
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {tagsCliente.map((tag) => (
                              <span
                                key={tag.id_tag}
                                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                                style={{ backgroundColor: tag.cor_hex || '#6b7280' }}
                              >
                                {tag.nome}
                              </span>
                            ))}
                            {totalConversas > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                {totalConversas} conversa{totalConversas !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      {totalConversas > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Ver conversas"
                          onClick={() => setConversasPessoa(cliente)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
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
            );
          })}
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

      {/* Dialog de conversas */}
      <ConversasDialog
        pessoa={conversasPessoa}
        open={!!conversasPessoa}
        onOpenChange={(v) => { if (!v) setConversasPessoa(null); }}
      />
    </>
  );
}
