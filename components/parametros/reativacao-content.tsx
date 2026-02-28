'use client';

import { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { RegraFormDialog } from './regra-form-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCcw,
  Save,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  RegraReativacao,
  Tag,
  Departamento,
  PreferenciasReativacao,
} from '@/lib/queries/parametros';

const TIPO_ACAO_LABELS: Record<string, string> = {
  MENSAGEM: 'Mensagem',
  TRANSBORDAR: 'Transbordo',
  TRANSFERIR_DEPARTAMENTO: 'Transferir Depto.',
  TAG: 'Aplicar Tag',
};

const TIPO_ACAO_VARIANT: Record<string, string> = {
  MENSAGEM: 'bg-blue-500/10 text-blue-600 border-blue-200',
  TRANSBORDAR: 'bg-orange-500/10 text-orange-600 border-orange-200',
  TRANSFERIR_DEPARTAMENTO: 'bg-purple-500/10 text-purple-600 border-purple-200',
  TAG: 'bg-green-500/10 text-green-600 border-green-200',
};

function formatMinutos(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function formatSegundos(sec: number): string {
  const h = Math.floor(sec / 3600);
  return h ? `${h}h` : `${sec}s`;
}

interface ReativacaoContentProps {
  regras: RegraReativacao[];
  preferencias: PreferenciasReativacao;
  tags: Tag[];
  departamentos: Departamento[];
  empresaId: string;
}

export function ReativacaoContent({
  regras: initialRegras,
  preferencias: initialPreferencias,
  tags,
  departamentos,
  empresaId,
}: ReativacaoContentProps) {
  const { toast } = useToast();
  const [regras, setRegras] = useState<RegraReativacao[]>(initialRegras);
  const [prefs, setPrefs] = useState(initialPreferencias);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [regraEditando, setRegraEditando] = useState<RegraReativacao | null>(null);
  const [deletando, setDeletando] = useState<string | null>(null);

  // ─── Preferências ─────────────────────────────────────────────────────────

  const handleSavePrefs = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);

    try {
      const supabase = createClient();

      if (prefs.id_preferencia) {
        const { error } = await supabase
          .from('empresa_preferencias_ia')
          .update({
            maximo_tentativas_reativacoes_ia: prefs.maximo_tentativas_reativacoes_ia,
            maximo_tempo_reativacoes_por_inatividade: prefs.maximo_tempo_reativacoes_por_inatividade,
            acao_apos_maximo_tentativas_reativacoes_ia: prefs.acao_apos_maximo_tentativas_reativacoes_ia,
            acao_apos_maximo_tempo_reativacoes_por_inatividade: prefs.acao_apos_maximo_tempo_reativacoes_por_inatividade,
          })
          .eq('id_preferencia', prefs.id_preferencia);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('empresa_preferencias_ia')
          .insert({ ...prefs, id_empresa: empresaId })
          .select()
          .single();

        if (error) throw error;
        setPrefs((p) => ({ ...p, id_preferencia: (data as { id_preferencia: string }).id_preferencia }));
      }

      toast({ title: 'Configurações salvas com sucesso.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSavingPrefs(false);
    }
  };

  // ─── Regras ───────────────────────────────────────────────────────────────

  const handleSuccess = (saved: RegraReativacao) => {
    setRegras((prev) => {
      const idx = prev.findIndex((r) => r.id_regra === saved.id_regra);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved].sort((a, b) => a.sequencia - b.sequencia);
    });
    setRegraEditando(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta regra?')) return;
    setDeletando(id);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('regras_reativacao').delete().eq('id_regra', id);
      if (error) throw error;
      setRegras((prev) => prev.filter((r) => r.id_regra !== id));
      toast({ title: 'Regra excluída.' });
    } catch {
      toast({ title: 'Erro ao excluir.', variant: 'destructive' });
    } finally {
      setDeletando(null);
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const idx = regras.findIndex((r) => r.id_regra === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === regras.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const next = [...regras];
    const tempSeq = next[idx].sequencia;
    next[idx] = { ...next[idx], sequencia: next[swapIdx].sequencia };
    next[swapIdx] = { ...next[swapIdx], sequencia: tempSeq };
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setRegras(next);

    try {
      const supabase = createClient();
      await Promise.all([
        supabase.from('regras_reativacao').update({ sequencia: next[idx].sequencia }).eq('id_regra', next[idx].id_regra),
        supabase.from('regras_reativacao').update({ sequencia: next[swapIdx].sequencia }).eq('id_regra', next[swapIdx].id_regra),
      ]);
    } catch {
      toast({ title: 'Erro ao reordenar.', variant: 'destructive' });
    }
  };

  const handleToggleAtivo = async (regra: RegraReativacao) => {
    const novoAtivo = !regra.ativo;
    setRegras((prev) => prev.map((r) => r.id_regra === regra.id_regra ? { ...r, ativo: novoAtivo } : r));
    try {
      const supabase = createClient();
      await supabase.from('regras_reativacao').update({ ativo: novoAtivo }).eq('id_regra', regra.id_regra);
    } catch {
      setRegras((prev) => prev.map((r) => r.id_regra === regra.id_regra ? { ...r, ativo: regra.ativo } : r));
      toast({ title: 'Erro ao atualizar.', variant: 'destructive' });
    }
  };

  const proximaSequencia = regras.length > 0
    ? Math.max(...regras.map((r) => r.sequencia)) + 1
    : 1;

  return (
    <div className="space-y-6">

      {/* ── Configurações gerais ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Defina os limites e ações de fallback quando as tentativas se esgotam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePrefs} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_tentativas">Máximo de tentativas</Label>
                <Input
                  id="max_tentativas"
                  type="number"
                  min={1}
                  value={prefs.maximo_tentativas_reativacoes_ia}
                  onChange={(e) => setPrefs((p) => ({ ...p, maximo_tentativas_reativacoes_ia: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  Quantidade máxima de reativações por conversa.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tempo">Tempo máximo de inatividade (segundos)</Label>
                <Input
                  id="max_tempo"
                  type="number"
                  min={0}
                  value={prefs.maximo_tempo_reativacoes_por_inatividade}
                  onChange={(e) => setPrefs((p) => ({ ...p, maximo_tempo_reativacoes_por_inatividade: Number(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  Atual: {formatSegundos(prefs.maximo_tempo_reativacoes_por_inatividade)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="acao_tentativas">Ação ao esgotar tentativas</Label>
                <select
                  id="acao_tentativas"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={prefs.acao_apos_maximo_tentativas_reativacoes_ia}
                  onChange={(e) => setPrefs((p) => ({ ...p, acao_apos_maximo_tentativas_reativacoes_ia: e.target.value }))}
                >
                  <option value="TRANSFERIR">Transferir para humano</option>
                  <option value="ENCERRAR">Encerrar conversa</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="acao_tempo">Ação ao esgotar tempo</Label>
                <select
                  id="acao_tempo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={prefs.acao_apos_maximo_tempo_reativacoes_por_inatividade}
                  onChange={(e) => setPrefs((p) => ({ ...p, acao_apos_maximo_tempo_reativacoes_por_inatividade: e.target.value }))}
                >
                  <option value="TRANSFERIR">Transferir para humano</option>
                  <option value="ENCERRAR">Encerrar conversa</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingPrefs} className="gap-2">
                <Save className="h-4 w-4" />
                {savingPrefs ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Regras ── */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Regras de Reativação
            </CardTitle>
            <CardDescription>
              Sequência de ações automáticas disparadas após inatividade do cliente.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => { setRegraEditando(null); setFormOpen(true); }}
          >
            <Plus className="h-4 w-4" />
            Nova Regra
          </Button>
        </CardHeader>

        <CardContent>
          {regras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <RefreshCcw className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma regra configurada. Clique em &quot;Nova Regra&quot; para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {regras.map((regra, idx) => (
                <div
                  key={regra.id_regra}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3 transition-opacity',
                    !regra.ativo && 'opacity-50'
                  )}
                >
                  {/* Sequência */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMove(regra.id_regra, 'up')}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold text-center text-muted-foreground w-4">{regra.sequencia}</span>
                    <button
                      onClick={() => handleMove(regra.id_regra, 'down')}
                      disabled={idx === regras.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full border',
                        TIPO_ACAO_VARIANT[regra.tipo_acao] ?? 'bg-muted text-muted-foreground border-border'
                      )}>
                        {TIPO_ACAO_LABELS[regra.tipo_acao] ?? regra.tipo_acao}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        após {formatMinutos(regra.tempo_espera_minutos)}
                      </span>

                      {regra.tempo_inicio && regra.tempo_fim && (
                        <span className="text-xs text-muted-foreground">
                          · {regra.tempo_inicio} – {regra.tempo_fim}
                        </span>
                      )}
                    </div>

                    {regra.mensagem_texto && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {regra.mensagem_texto}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={regra.ativo}
                      onCheckedChange={() => handleToggleAtivo(regra)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setRegraEditando(regra); setFormOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10',
                        deletando === regra.id_regra && 'opacity-50 pointer-events-none'
                      )}
                      onClick={() => handleDelete(regra.id_regra)}
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

      <RegraFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setRegraEditando(null); }}
        empresaId={empresaId}
        regra={regraEditando}
        proximaSequencia={proximaSequencia}
        tags={tags}
        departamentos={departamentos}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
