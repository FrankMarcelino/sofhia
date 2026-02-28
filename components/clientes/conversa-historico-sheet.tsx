'use client';

import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bot,
  User,
  Clock,
  Eye,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Pessoa, ConversaSimples, TagSimples } from '@/lib/queries/clientes';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Interacao {
  id_interacao: string;
  created_at: string;
  remetente: string;
  mensagem_texto: string | null;
  tipo_mensagem: string;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

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

// ─── Tag helpers ───────────────────────────────────────────────────────────────

function getTagsConversa(conv: ConversaSimples): TagSimples[] {
  return (conv.conversas_tags ?? [])
    .map((ct) => (Array.isArray(ct.tags) ? ct.tags[0] : ct.tags))
    .filter(Boolean) as TagSimples[];
}

// ─── Chat bubble ───────────────────────────────────────────────────────────────

function MessageBubble({
  interacao,
  nomeCliente,
}: {
  interacao: Interacao;
  nomeCliente: string;
}) {
  const isBot    = ['assistant', 'bot', 'ia'].includes(interacao.remetente);
  const isHuman  = ['humano', 'atendente'].includes(interacao.remetente);
  const isClient = !isBot && !isHuman;

  const sender = isBot
    ? { name: 'SOFHIA',    Icon: Bot,  bubble: 'bg-primary/10 text-foreground rounded-tl-sm',    row: '' }
    : isHuman
      ? { name: 'Atendente', Icon: User, bubble: 'bg-slate-100 dark:bg-slate-800 text-foreground rounded-tl-sm', row: '' }
      : { name: nomeCliente, Icon: User, bubble: 'bg-primary text-primary-foreground rounded-tr-sm',   row: 'ml-auto flex-row-reverse' };

  const avatarColor = isBot ? 'bg-primary text-white' : isHuman ? 'bg-slate-600 text-white' : 'bg-muted text-foreground';

  return (
    <div className={cn('flex gap-2.5 max-w-[78%]', sender.row)}>
      {/* Avatar */}
      <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-1', avatarColor)}>
        <sender.Icon className="h-3.5 w-3.5" />
      </div>

      {/* Message */}
      <div className={cn('flex flex-col gap-1', isClient ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{sender.name}</span>
          <span className="text-[10px] text-muted-foreground/60">
            {format(new Date(interacao.created_at), 'HH:mm')}
          </span>
        </div>
        <div className={cn('rounded-2xl px-3.5 py-2 text-sm leading-relaxed max-w-full', sender.bubble)}>
          {interacao.mensagem_texto ? (
            <p className="whitespace-pre-wrap break-words">{interacao.mensagem_texto}</p>
          ) : (
            <p className="italic opacity-50 text-xs">[mídia não suportada]</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function MessagesSkeleton() {
  return (
    <div className="space-y-5 animate-pulse px-4 py-4">
      {[false, true, false, false, true].map((right, i) => (
        <div key={i} className={cn('flex gap-2.5 max-w-[65%]', right ? 'ml-auto flex-row-reverse' : '')}>
          <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-14 bg-muted rounded-full" />
            <div className={cn('h-9 bg-muted rounded-2xl', right ? 'w-40' : 'w-52')} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Messages panel ────────────────────────────────────────────────────────────

function MensagensPanel({
  conversa,
  nomeCliente,
}: {
  conversa: ConversaSimples;
  nomeCliente: string;
}) {
  const [interacoes, setInteracoes] = useState<Interacao[] | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Component is remounted via key when id_conversa changes — no need to reset state here
  useEffect(() => {
    let cancelled = false;

    createClient()
      .from('interacoes')
      .select('id_interacao, created_at, remetente, mensagem_texto, tipo_mensagem')
      .eq('id_conversa', conversa.id_conversa)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setInteracoes(data ?? []);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom once messages load
  useEffect(() => {
    if (interacoes && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [interacoes]);

  const tags = getTagsConversa(conversa);

  // Group messages by calendar day
  const byDay: [string, Interacao[]][] = [];
  for (const msg of (interacoes ?? [])) {
    const day = format(new Date(msg.created_at), 'yyyy-MM-dd');
    const last = byDay[byDay.length - 1];
    if (last && last[0] === day) {
      last[1].push(msg);
    } else {
      byDay.push([day, [msg]]);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Conversation meta bar */}
      <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2 flex-wrap shrink-0">
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full border font-medium',
          STATUS_CLASS[conversa.status_conversa] ?? 'bg-muted text-muted-foreground border-border'
        )}>
          {STATUS_LABEL[conversa.status_conversa] ?? conversa.status_conversa}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(conversa.created_at), { addSuffix: true, locale: ptBR })}
        </span>
        {tags.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground/60 font-medium">·</span>
            {tags.map((tag) => (
              <span
                key={tag.id_tag}
                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: tag.cor_hex || '#6b7280' }}
              >
                {tag.nome}
              </span>
            ))}
          </>
        )}
        {conversa.encerrar_motivo && (
          <span className="text-xs text-muted-foreground ml-auto truncate max-w-[180px]" title={conversa.encerrar_motivo}>
            Motivo: {conversa.encerrar_motivo}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-muted/5">
        {loading ? (
          <MessagesSkeleton />
        ) : !interacoes || interacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/20 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma mensagem nesta conversa.</p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6">
            {byDay.map(([day, msgs]) => (
              <div key={day} className="space-y-3">
                {/* Day separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground px-2.5 py-1 rounded-full bg-background border whitespace-nowrap">
                    {format(new Date(day + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: ptBR })}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {msgs.map((msg) => (
                  <MessageBubble
                    key={msg.id_interacao}
                    interacao={msg}
                    nomeCliente={nomeCliente}
                  />
                ))}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Read-only footer */}
      <div className="px-4 py-2.5 border-t bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center gap-1.5 shrink-0">
        <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Histórico — somente leitura
        </span>
      </div>
    </div>
  );
}

// ─── Conversation list item ─────────────────────────────────────────────────────

function ConversaItem({
  conversa,
  index,
  total,
  isSelected,
  onClick,
}: {
  conversa: ConversaSimples;
  index: number;
  total: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const tags = getTagsConversa(conversa);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg px-3 py-2.5 transition-all border',
        isSelected
          ? 'bg-primary/8 border-primary/20 shadow-sm'
          : 'hover:bg-muted/60 border-transparent'
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-xs font-semibold text-foreground">
          Conversa #{total - index}
        </span>
        {isSelected && <ChevronRight className="h-3 w-3 text-primary shrink-0" />}
      </div>

      <span className={cn(
        'inline-block text-[10px] px-1.5 py-0.5 rounded-full border font-medium leading-none mb-1.5',
        STATUS_CLASS[conversa.status_conversa] ?? 'bg-muted text-muted-foreground border-border'
      )}>
        {STATUS_LABEL[conversa.status_conversa] ?? conversa.status_conversa}
      </span>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
        <Clock className="h-2.5 w-2.5" />
        {formatDistanceToNow(new Date(conversa.created_at), { addSuffix: true, locale: ptBR })}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id_tag}
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white leading-none"
              style={{ backgroundColor: tag.cor_hex || '#6b7280' }}
            >
              {tag.nome}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Main sheet ─────────────────────────────────────────────────────────────────

interface ConversaHistoricoSheetProps {
  pessoa: Pessoa | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ConversaHistoricoSheet({
  pessoa,
  open,
  onOpenChange,
}: ConversaHistoricoSheetProps) {
  const conversas = [...(pessoa?.conversas ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const [selecionada, setSelecionada] = useState<ConversaSimples | null>(null);
  const isMultiple = conversas.length > 1;

  // Auto-select most recent conversation when opening
  useEffect(() => {
    if (open && conversas.length > 0) {
      setSelecionada(conversas[0]);
    }
    if (!open) {
      setSelecionada(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pessoa?.id_pessoa]);

  if (!pessoa) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn(isMultiple ? 'sm:max-w-[860px]' : 'sm:max-w-[600px]')}>
        {/* Header */}
        <SheetHeader>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <SheetTitle className="truncate">
              {pessoa.nome || 'Cliente sem nome'}
            </SheetTitle>
            {pessoa.telefone && (
              <p className="text-xs text-muted-foreground mt-0.5">{pessoa.telefone}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 font-normal">
            {conversas.length} conversa{conversas.length !== 1 ? 's' : ''}
          </Badge>
        </SheetHeader>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Sidebar — visible only when multiple conversations */}
          {isMultiple && (
            <aside className="w-[210px] shrink-0 border-r overflow-y-auto bg-muted/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1.5">
                Conversas
              </p>
              <div className="px-2 pb-3 space-y-1">
                {conversas.map((conv, idx) => (
                  <ConversaItem
                    key={conv.id_conversa}
                    conversa={conv}
                    index={idx}
                    total={conversas.length}
                    isSelected={selecionada?.id_conversa === conv.id_conversa}
                    onClick={() => setSelecionada(conv)}
                  />
                ))}
              </div>
            </aside>
          )}

          {/* Main messages area */}
          <main className="flex-1 min-w-0 flex flex-col">
            {selecionada ? (
              <MensagensPanel
                key={selecionada.id_conversa}
                conversa={selecionada}
                nomeCliente={pessoa.nome || 'Cliente'}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Selecione uma conversa para visualizar.
                </p>
              </div>
            )}
          </main>
        </div>
      </SheetContent>
    </Sheet>
  );
}
