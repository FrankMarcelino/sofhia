'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ExtracaoFormDialog } from './extracao-form-dialog';
import { Plus, Pencil, Trash2, Braces, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agente, Extracao } from '@/lib/queries/neurocore';

const TIPO_LABEL: Record<string, string> = {
  string: 'Texto',
  number: 'Número',
  boolean: 'Sim/Não',
  date: 'Data',
  email: 'E-mail',
  phone: 'Telefone',
  cpf: 'CPF',
  cnpj: 'CNPJ',
};

const TIPO_VARIANT: Record<string, string> = {
  string: 'bg-blue-500/10 text-blue-600 border-blue-200',
  number: 'bg-purple-500/10 text-purple-600 border-purple-200',
  boolean: 'bg-green-500/10 text-green-600 border-green-200',
  date: 'bg-orange-500/10 text-orange-600 border-orange-200',
  email: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
  phone: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  cpf: 'bg-red-500/10 text-red-600 border-red-200',
  cnpj: 'bg-amber-500/10 text-amber-600 border-amber-200',
};

interface ExtracoesContentProps {
  agentes: Agente[];
  extracoesByAgente: Record<string, Extracao[]>;
}

export function ExtracoesContent({ agentes, extracoesByAgente: initial }: ExtracoesContentProps) {
  const { toast } = useToast();
  const [agenteIdSelecionado, setAgenteIdSelecionado] = useState(agentes[0]?.id_agente ?? '');
  const [extracoesByAgente, setExtracoesByAgente] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [extracoEditando, setExtracaoEditando] = useState<Extracao | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

  const agenteSelecionado = agentes.find((a) => a.id_agente === agenteIdSelecionado);
  const extracoes = extracoesByAgente[agenteIdSelecionado] ?? [];

  const handleSuccess = (saved: Extracao) => {
    setExtracoesByAgente((prev) => {
      const list = prev[agenteIdSelecionado] ?? [];
      const idx = list.findIndex((e) => e.id_agente_extracoes === saved.id_agente_extracoes);
      const next = idx >= 0
        ? list.map((e, i) => i === idx ? saved : e)
        : [...list, saved];
      return { ...prev, [agenteIdSelecionado]: next };
    });
    setExtracaoEditando(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta extração? O agente deixará de coletar este dado.')) return;
    setDeletando(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('agente_extracoes')
        .delete()
        .eq('id_agente_extracoes', id);
      if (error) throw error;
      setExtracoesByAgente((prev) => ({
        ...prev,
        [agenteIdSelecionado]: (prev[agenteIdSelecionado] ?? []).filter(
          (e) => e.id_agente_extracoes !== id
        ),
      }));
      toast({ title: 'Extração excluída.' });
    } catch {
      toast({ title: 'Erro ao excluir.', variant: 'destructive' });
    } finally {
      setDeletando(null);
    }
  };

  if (agentes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum agente encontrado.</p>
          <p className="text-xs text-muted-foreground mt-1">Configure um agente no Editor antes de adicionar extrações.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Seletor de agente (só aparece se houver mais de um) */}
      {agentes.length > 1 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground shrink-0">Agente:</span>
          <div className="flex gap-2 flex-wrap">
            {agentes.map((a) => (
              <button
                key={a.id_agente}
                onClick={() => setAgenteIdSelecionado(a.id_agente)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  agenteIdSelecionado === a.id_agente
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                {a.nome_agente}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card de extrações */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Braces className="h-4 w-4" />
              Extrações
              {agenteSelecionado && (
                <span className="text-muted-foreground font-normal text-sm">
                  — {agenteSelecionado.nome_agente}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Campos que o agente coleta durante a conversa. Defina o nome, tipo e instrução para a IA.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="info">{extracoes.length}</Badge>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => { setExtracaoEditando(null); setFormOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              Nova Extração
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {extracoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Braces className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma extração configurada. Clique em &quot;Nova Extração&quot; para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {extracoes.map((ext, idx) => (
                <div
                  key={ext.id_agente_extracoes}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3"
                >
                  {/* Índice */}
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                    {idx + 1}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">
                        {ext.informacao_para_extrair}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full border font-medium',
                        TIPO_VARIANT[ext.tipo_dado] ?? 'bg-muted text-muted-foreground border-border'
                      )}>
                        {TIPO_LABEL[ext.tipo_dado] ?? ext.tipo_dado}
                      </span>
                    </div>
                    {ext.descricao_para_ia && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {ext.descricao_para_ia}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setExtracaoEditando(ext); setFormOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10',
                        deletando === ext.id_agente_extracoes && 'opacity-50 pointer-events-none'
                      )}
                      onClick={() => handleDelete(ext.id_agente_extracoes)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ExtracaoFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setExtracaoEditando(null); }}
        agenteId={agenteIdSelecionado}
        extracao={extracoEditando}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
