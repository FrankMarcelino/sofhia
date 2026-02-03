import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

async function getLayoutData() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Buscar dados do usuário
  const { data: userData } = await supabase
    .from('usuarios_sofhia')
    .select('id, id_empresa, nome_usuario, ativo')
    .eq('id', user.id)
    .single();

  // Buscar dados da empresa e carteira
  const { data: empresaData } = userData?.id_empresa
    ? await supabase
        .from('empresa')
        .select('id_empresa, nome')
        .eq('id_empresa', userData.id_empresa)
        .single()
    : { data: null };

  const { data: carteiraData } = userData?.id_empresa
    ? await supabase
        .from('carteiras')
        .select('saldo_creditos')
        .eq('id_empresa', userData.id_empresa)
        .single()
    : { data: null };

  return {
    user: userData ? {
      id: userData.id,
      nome: userData.nome_usuario,
      email: user.email || '',
    } : undefined,
    empresa: empresaData ? {
      id: empresaData.id_empresa,
      nome_fantasia: empresaData.nome,
      saldo: carteiraData?.saldo_creditos || 0,
    } : undefined,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, empresa } = await getLayoutData();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Always visible (desktop/tablet only) */}
      <Sidebar />

      {/* Main Content - Flex grows to fill remaining space */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar user={user} empresa={empresa} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-10 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
