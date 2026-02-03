import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, ListOrdered, Database } from 'lucide-react';
import { PersonaTab } from '@/components/neurocore/editor/persona-tab';
import { InstrucoesTab } from '@/components/neurocore/editor/instrucoes-tab';
import { ExtracoesTab } from '@/components/neurocore/editor/extracoes-tab';
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
  };
}

export default async function EditorPage() {
  const { agente, modelos, extracoes, empresaId } = await getEditorData();

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

      {/* Tabs */}
      <Tabs defaultValue="persona" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="persona" className="gap-2">
            <Bot className="h-4 w-4" />
            Persona
          </TabsTrigger>
          <TabsTrigger value="instrucoes" className="gap-2">
            <ListOrdered className="h-4 w-4" />
            Instruções
          </TabsTrigger>
          <TabsTrigger value="extracoes" className="gap-2">
            <Database className="h-4 w-4" />
            Extrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona">
          <PersonaTab agente={agente} modelos={modelos} empresaId={empresaId} />
        </TabsContent>

        <TabsContent value="instrucoes">
          <InstrucoesTab agente={agente} />
        </TabsContent>

        <TabsContent value="extracoes">
          <ExtracoesTab agente={agente} extracoes={extracoes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
