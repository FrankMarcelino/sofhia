import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Server, Bot, RefreshCcw, Tag } from 'lucide-react';
import { EmpresaForm } from '@/components/parametros/empresa-form';
import { UpChatConfigForm } from '@/components/parametros/upchat-config';
import { PreferenciasIAForm } from '@/components/parametros/preferencias-ia';
import { ReativacaoContent } from '@/components/parametros/reativacao-content';
import { TagsContent } from '@/components/parametros/tags-content';
import {
  getEmpresa,
  getUpChatConfig,
  getPreferenciasIA,
  getRegrasReativacao,
  getPreferenciasReativacao,
  getTagsEmpresa,
  getTagsCompletas,
  getDepartamentosEmpresa,
} from '@/lib/queries/parametros';

async function getParametrosData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('usuarios_sofhia')
    .select('id, id_empresa')
    .eq('id', user.id)
    .single();

  const empresaId = userData?.id_empresa;

  if (!empresaId) {
    return {
      empresa: null,
      upChatConfig: null,
      preferenciasIA: null,
      regrasReativacao: [],
      preferenciasReativacao: null,
      tags: [],
      tagsCompletas: [],
      departamentos: [],
      empresaId: '',
    };
  }

  const [empresa, upChatConfig, preferenciasIA, regrasReativacao, preferenciasReativacao, tags, tagsCompletas, departamentos] =
    await Promise.all([
      getEmpresa(empresaId),
      getUpChatConfig(empresaId),
      getPreferenciasIA(empresaId),
      getRegrasReativacao(empresaId),
      getPreferenciasReativacao(empresaId),
      getTagsEmpresa(empresaId),
      getTagsCompletas(empresaId),
      getDepartamentosEmpresa(empresaId),
    ]);

  return {
    empresa,
    upChatConfig,
    preferenciasIA,
    regrasReativacao,
    preferenciasReativacao,
    tags,
    tagsCompletas,
    departamentos,
    empresaId,
  };
}

export default async function ParametrosPage() {
  const {
    empresa,
    upChatConfig,
    preferenciasIA,
    regrasReativacao,
    preferenciasReativacao,
    tags,
    tagsCompletas,
    departamentos,
    empresaId,
  } = await getParametrosData();

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <section className="pb-8">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Parâmetros
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure as informações da sua empresa e integrações do sistema.
        </p>
      </section>

      {/* Tabs */}
      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="empresa" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="upchat" className="gap-2">
            <Server className="h-4 w-4" />
            UpChat
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-2">
            <Bot className="h-4 w-4" />
            IA
          </TabsTrigger>
          <TabsTrigger value="reativacao" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Reativação
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <EmpresaForm empresa={empresa} />
        </TabsContent>

        <TabsContent value="upchat">
          <UpChatConfigForm config={upChatConfig} />
        </TabsContent>

        <TabsContent value="ia">
          <PreferenciasIAForm preferencias={preferenciasIA} />
        </TabsContent>

        <TabsContent value="reativacao">
          <ReativacaoContent
            regras={regrasReativacao}
            preferencias={preferenciasReativacao!}
            tags={tags}
            departamentos={departamentos}
            empresaId={empresaId}
          />
        </TabsContent>

        <TabsContent value="tags">
          <TagsContent tags={tagsCompletas} empresaId={empresaId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
