'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ConversasList } from './conversas-list';
import { ChatViewer } from './chat-viewer';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversa {
  id_conversa: string;
  created_at: string;
  status_conversa: 'ia_conversando' | 'pausado' | 'encerrado' | 'aguardando_humano';
  data_ultima_interacao: string;
  pessoa: {
    id_pessoa: string;
    nome: string | null;
    telefone: string | null;
  } | null;
  agente: {
    id_agente: string;
    nome_agente: string;
  } | null;
}

interface Interacao {
  id_interacao: string;
  created_at: string;
  remetente: string;
  mensagem_texto: string | null;
  tipo_mensagem: string;
}

interface AtendimentoWrapperProps {
  conversas: Conversa[];
}

export function AtendimentoWrapper({ conversas }: AtendimentoWrapperProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [, setTick] = useState(0);

  const [conversaSelecionada, setConversaSelecionada] = useState<string | undefined>();
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);

  const conversaAtual = conversas.find(c => c.id_conversa === conversaSelecionada);

  // Atualiza o "há X minutos" a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function carregarInteracoes() {
      if (!conversaSelecionada) {
        setInteracoes([]);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('interacoes')
          .select('*')
          .eq('id_conversa', conversaSelecionada)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erro ao buscar interações:', error);
          setInteracoes([]);
        } else {
          setInteracoes(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar interações:', error);
        setInteracoes([]);
      }
    }

    carregarInteracoes();
  }, [conversaSelecionada]);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
    setLastUpdated(new Date());
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {/* Banner de aviso + botão de refresh */}
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 text-amber-700 text-xs">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Esta tela não atualiza automaticamente. Recarregue para ver novas conversas.</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs text-amber-600 hidden sm:block">
            Atualizado {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ptBR })}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isPending}
            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 h-7 text-xs"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
            {isPending ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Grid de cards */}
      <section className="grid grid-cols-5 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column - Conversas List (2/5 width) */}
        <div className="col-span-2 flex flex-col min-h-0 overflow-hidden">
          <ConversasList
            conversas={conversas}
            conversaSelecionada={conversaSelecionada}
            onSelectConversa={setConversaSelecionada}
            className="flex-1 min-h-0"
          />
        </div>

        {/* Right Column - Chat Viewer (3/5 width) */}
        <div className="col-span-3 flex flex-col min-h-0 overflow-hidden">
          <ChatViewer
            interacoes={interacoes}
            nomeCliente={conversaAtual?.pessoa?.nome || undefined}
            nomeAgente={conversaAtual?.agente?.nome_agente || undefined}
            className="flex-1 min-h-0"
          />
        </div>
      </section>
    </div>
  );
}
