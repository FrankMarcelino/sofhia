import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertCircle, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AgentEditTabs } from '@/components/neurocore/editor/agent-edit-tabs';
import {
  getAgente,
  getModelosIA,
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
      agente: null,
      modelos: [],
      extracoes: [],
      error: 'Empresa não encontrada.',
    };
  }

  // Buscar dados em paralelo
  const [agente, modelos] = await Promise.all([
    getAgente(empresaId),
    getModelosIA(),
  ]);

  // Se existe agente, buscar extrações
  const extracoes = agente ? await getExtracoes(agente.id_agente) : [];

  return {
    agente,
    modelos,
    extracoes,
    empresaId,
    error: null,
  };
}

export default async function EditorPage() {
  const { agente, modelos, extracoes, error } = await getEditorData();

  // Se não há agente, mostrar mensagem
  if (!agente) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <section className="pb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Editor de Agente
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure a personalidade, instruções e extrações de dados do seu agente de IA.
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
          Editor de Agente
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure a personalidade, instruções e extrações de dados do seu agente de IA.
        </p>
      </section>

      {/* Editor com Tabs */}
      <AgentEditTabs
        agente={agente as never}
        modelos={modelos as never}
        extracoes={extracoes}
      />
    </div>
  );
}
