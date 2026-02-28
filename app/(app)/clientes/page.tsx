import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPessoas, getTotalPessoas } from '@/lib/queries/clientes';
import { ClientesTable } from '@/components/clientes/clientes-table';
import { Users } from 'lucide-react';

async function getClientesData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    return { clientes: [], total: 0, empresaId: '' };
  }

  const [clientes, total] = await Promise.all([
    getPessoas(empresaId),
    getTotalPessoas(empresaId),
  ]);

  return { clientes, total, empresaId };
}

export default async function ClientesPage() {
  const { clientes, total, empresaId } = await getClientesData();

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <section className="pb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-12">
          Gerencie os contatos e clientes cadastrados no sistema.
        </p>
      </section>

      {/* Conteúdo */}
      <ClientesTable clientes={clientes} empresaId={empresaId} total={total} />
    </div>
  );
}
