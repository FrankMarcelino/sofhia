'use client';

import { useState, useEffect } from 'react';
import { ConversasList } from './conversas-list';
import { ChatViewer } from './chat-viewer';
import { createClient } from '@/lib/supabase/client';

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
  const [conversaSelecionada, setConversaSelecionada] = useState<string | undefined>();
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);

  const conversaAtual = conversas.find(c => c.id_conversa === conversaSelecionada);

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

  return (
    <section className="grid grid-cols-5 gap-6 h-full overflow-hidden">
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
  );
}
