import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertCircle, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AgentSelector } from '@/components/neurocore/editor/agent-selector';
import {
  getAgentes,
  getExtracoes,
} from '@/lib/queries/neurocore';

async function getEditorData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar dados do usuário
  const { data: userData } = await supabase
    .from('usuarios_sofhia')
    .select('id, id_empresa')
    .eq('id', user.id)
    .single();

  const empresaId = userData?.id_empresa;

  if (!empresaId) {
    return {
      agentes: [],
      extracoesByAgente: {},
      error: 'Empresa não encontrada.',
    };
  }

  // Buscar dados em paralelo
  const agentes = await getAgentes(empresaId);

  // Buscar extrações de todos os agentes em paralelo
  const extracoesByAgente: Record<string, Awaited<ReturnType<typeof getExtracoes>>> = {};

  if (agentes.length > 0) {
    const extracoesPromises = agentes.map(async (agente) => {
      const extracoes = await getExtracoes(agente.id_agente);
      return { id: agente.id_agente, extracoes };
    });

    const results = await Promise.all(extracoesPromises);
    results.forEach(({ id, extracoes }) => {
      extracoesByAgente[id] = extracoes;
    });
  }

  return {
    agentes,
    extracoesByAgente,
    empresaId,
    error: null,
  };
}

export default async function EditorPage() {
  const { agentes, extracoesByAgente, error } = await getEditorData();

  // Se não há agentes, mostrar mensagem
  if (agentes.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <section className="pb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Editor de Agentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure a personalidade, instruções e extrações de dados dos seus agentes de IA.
          </p>
        </section>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>Nenhum agente encontrado</AlertTitle>
            <AlertDescription>
              Seu Neurocore ainda não possui agentes configurados.
              Entre em contato com o administrador para configurar seu agente.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <section className="pb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Editor de Agentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Selecione um agente para configurar sua personalidade, instruções e extrações de dados.
        </p>
      </section>

      {/* Seletor de Agentes + Editor */}
      <AgentSelector
        agentes={agentes as never}
        extracoesByAgente={extracoesByAgente}
      />
    </div>
  );
}
