'use client';

import { useState, useMemo } from 'react';
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
  MessageSquare,
  Tag,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ClienteFormDialog } from './cliente-form-dialog';
import { ConversaHistoricoSheet } from './conversa-historico-sheet';
import type { Pessoa, TagSimples } from '@/lib/queries/clientes';
import { cn } from '@/lib/utils';

// ─── Tag helpers ───────────────────────────────────────────────────────────────

function resolveTag(raw: unknown): TagSimples | null {
  if (!raw) return null;
  const t = Array.isArray(raw) ? raw[0] : raw;
  return t ?? null;
}

// Used only for display — up to 5 from most recent conversations
function getTagsDisplay(pessoa: Pessoa, limit = 5): TagSimples[] {
  const sorted = [...(pessoa.conversas ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const map = new Map<string, TagSimples>();
  for (const conv of sorted) {
    for (const ct of (conv.conversas_tags ?? [])) {
      const tag = resolveTag(ct.tags);
      if (tag && !map.has(tag.id_tag)) {
        map.set(tag.id_tag, tag);
        if (map.size >= limit) return Array.from(map.values());
      }
    }
  }
  return Array.from(map.values());
}

// Used for filter check — scans ALL conversations, short-circuits on first match
function pessoaTemTag(pessoa: Pessoa, idTag: string): boolean {
  for (const conv of (pessoa.conversas ?? [])) {
    for (const ct of (conv.conversas_tags ?? [])) {
      const tag = resolveTag(ct.tags);
      if (tag?.id_tag === idTag) return true;
    }
  }
  return false;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ClientesTableProps {
  clientes: Pessoa[];
  empresaId: string;
  total: number;
  tags?: TagSimples[]; // company-level tags from server (used as fallback for filter)
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ClientesTable({ clientes: initial, empresaId, tags: serverTags = [] }: ClientesTableProps) {
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Pessoa[]>(initial);
  const [busca, setBusca] = useState('');
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Pessoa | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);
  const [historicoAberto, setHistoricoAberto] = useState<Pessoa | null>(null);

  // Derive available filter tags from loaded conversation data.
  // Falls back to company-level tags so the filter is always visible.
  const availableTags = useMemo(() => {
    const map = new Map<string, TagSimples>();
    // seed with company tags (so filter shows even before conversation data loads)
    for (const t of serverTags) map.set(t.id_tag, t);
    // overlay with tags actually present in loaded clients
    for (const c of clientes) {
      for (const conv of (c.conversas ?? [])) {
        for (const ct of (conv.conversas_tags ?? [])) {
          const tag = resolveTag(ct.tags);
          if (tag) map.set(tag.id_tag, tag);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [clientes, serverTags]);

  // Filtered list — uses pessoaTemTag (checks ALL conversations, no limit)
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
    if (tagFiltro && !pessoaTemTag(c, tagFiltro)) return false;
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
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir o cliente.', variant: 'destructive' });
    } finally {
      setDeletando(null);
    }
  };

  const formatLocation = (c: Pessoa) => {
    const parts = [c.cidade, c.estado].filter(Boolean);
    return parts.length ? parts.join(' - ') : null;
  };

  const toggleTag = (id: string) => setTagFiltro((prev) => (prev === id ? null : id));

  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
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
        <Button onClick={() => { setClienteEditando(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* ── Tag filter bar ───────────────────────────────────────── */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-5 p-3 rounded-lg bg-muted/40 border border-border/50">
          <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-muted-foreground mr-1">Tags:</span>

          {availableTags.map((tag) => {
            const active = tagFiltro === tag.id_tag;
            return (
              <button
                key={tag.id_tag}
                type="button"
                onClick={() => toggleTag(tag.id_tag)}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium',
                  'border transition-all duration-150 cursor-pointer select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  active
                    ? 'text-white border-transparent shadow-md scale-[0.96]'
                    : 'bg-background border-border/70 text-foreground hover:shadow-sm hover:border-border active:scale-[0.96]'
                )}
                style={active ? { backgroundColor: tag.cor_hex || '#6b7280' } : undefined}
              >
                {/* Colored dot when inactive */}
                {!active && (
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.cor_hex || '#6b7280' }}
                  />
                )}
                {tag.nome}
                {/* × icon when active */}
                {active && <X className="h-3 w-3 ml-0.5 opacity-80 shrink-0" />}
              </button>
            );
          })}

          {tagFiltro && (
            <button
              type="button"
              onClick={() => setTagFiltro(null)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-1"
            >
              Limpar filtro
            </button>
          )}
        </div>
      )}

      {/* ── Result count ─────────────────────────────────────────── */}
      <div className="mb-3 text-sm text-muted-foreground">
        {busca || tagFiltro
          ? `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`
          : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} cadastrado${clientes.length !== 1 ? 's' : ''}`}
      </div>

      {/* ── Client list ──────────────────────────────────────────── */}
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
            const tagsCliente = getTagsDisplay(cliente);
            const totalConversas = (cliente.conversas ?? []).length;
            const loc = formatLocation(cliente);

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
                        {/* Nome */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {cliente.nome || (
                              <span className="text-muted-foreground italic">Sem nome</span>
                            )}
                          </span>
                          {cliente.cnpj && <Badge variant="outline" className="text-xs">PJ</Badge>}
                        </div>

                        {/* Contatos */}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                          {cliente.telefone && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />{cliente.telefone}
                            </span>
                          )}
                          {cliente.email && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                              <Mail className="h-3.5 w-3.5" />{cliente.email}
                            </span>
                          )}
                          {loc && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />{loc}
                            </span>
                          )}
                        </div>

                        {cliente.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                            {cliente.observacoes}
                          </p>
                        )}

                        {/* Tags das conversas + contador */}
                        {(tagsCliente.length > 0 || totalConversas > 0) && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            {tagsCliente.map((tag) => {
                              const isActive = tagFiltro === tag.id_tag;
                              return (
                                <button
                                  key={tag.id_tag}
                                  type="button"
                                  onClick={() => toggleTag(tag.id_tag)}
                                  title={isActive ? 'Remover filtro' : `Filtrar por ${tag.nome}`}
                                  className={cn(
                                    'text-xs px-2 py-0.5 rounded-full font-medium text-white',
                                    'cursor-pointer transition-all duration-150 select-none',
                                    isActive
                                      ? 'ring-2 ring-offset-1 ring-white/70 opacity-100 shadow-sm'
                                      : 'opacity-85 hover:opacity-100 hover:shadow-sm'
                                  )}
                                  style={{ backgroundColor: tag.cor_hex || '#6b7280' }}
                                >
                                  {tag.nome}
                                </button>
                              );
                            })}
                            {totalConversas > 0 && (
                              <button
                                type="button"
                                onClick={() => setHistoricoAberto(cliente)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
                              >
                                <MessageSquare className="h-3 w-3 group-hover:text-primary" />
                                {totalConversas} conversa{totalConversas !== 1 ? 's' : ''}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {totalConversas > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Ver conversas"
                          onClick={() => setHistoricoAberto(cliente)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setClienteEditando(cliente); setFormOpen(true); }}
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
        onOpenChange={(v) => { setFormOpen(v); if (!v) setClienteEditando(null); }}
        empresaId={empresaId}
        cliente={clienteEditando}
        onSuccess={handleSuccess}
      />

      {/* Sheet de histórico */}
      <ConversaHistoricoSheet
        pessoa={historicoAberto}
        open={!!historicoAberto}
        onOpenChange={(v) => { if (!v) setHistoricoAberto(null); }}
      />
    </>
  );
}
