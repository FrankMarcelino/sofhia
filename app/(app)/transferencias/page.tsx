import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTransferenciasDepartamentos } from '@/lib/queries/transferencias';
import { TransferenciasContent } from '@/components/transferencias/transferencias-content';
import { ArrowRightLeft } from 'lucide-react';

async function getTransferenciasData() {
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
    return { transferencias: [], empresaId: '' };
  }

  const transferencias = await getTransferenciasDepartamentos(empresaId);

  return { transferencias, empresaId };
}

export default async function TransferenciasPage() {
  const { transferencias, empresaId } = await getTransferenciasData();

  return (
    <div className="w-full max-w-5xl mx-auto">
      <section className="pb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Transferências de Departamentos
          </h1>
        </div>
        <p className="text-sm text-muted-foreground pl-12">
          Configure as regras de transferência de atendimento entre departamentos no UpChat.
        </p>
      </section>

      <TransferenciasContent
        transferencias={transferencias}
        empresaId={empresaId}
      />
    </div>
  );
}
