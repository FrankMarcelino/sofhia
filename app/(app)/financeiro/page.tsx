import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CarteiraCard } from '@/components/financeiro/carteira-card';
import { ResumoFinanceiro } from '@/components/financeiro/resumo-financeiro';
import { Extrato } from '@/components/financeiro/extrato';
import { RecargaOptions } from '@/components/financeiro/recarga-options';
import {
  getMovimentacoes,
  getResumoFinanceiro,
} from '@/lib/queries/financeiro';

async function getFinanceiroData() {
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
      resumo: {
        saldo: 0,
        alertaSaldoBaixo: 50,
        consumo30d: 0,
        consumo7d: 0,
        mediadiaria: 0,
        recargasMes: 0,
        diasRestantes: 0,
      },
      movimentacoes: [],
    };
  }

  // Buscar dados em paralelo
  const [resumo, movimentacoes] = await Promise.all([
    getResumoFinanceiro(empresaId),
    getMovimentacoes(empresaId, 15),
  ]);

  return {
    resumo,
    movimentacoes,
  };
}

export default async function FinanceiroPage() {
  const { resumo, movimentacoes } = await getFinanceiroData();

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <section className="pb-10">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Financeiro
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus créditos, acompanhe o consumo e adicione saldo.
        </p>
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-5 gap-8 pb-10">
        {/* Left Column - Carteira, Resumo e Extrato (3/5 width) */}
        <div className="col-span-3 space-y-6">
          <CarteiraCard
            saldo={resumo.saldo}
            alertaSaldoBaixo={resumo.alertaSaldoBaixo}
            diasRestantes={resumo.diasRestantes}
          />
          <ResumoFinanceiro
            consumo30d={resumo.consumo30d}
            consumo7d={resumo.consumo7d}
            mediadiaria={resumo.mediadiaria}
            recargasMes={resumo.recargasMes}
          />
          <Extrato movimentacoes={movimentacoes} />
        </div>

        {/* Right Column - Recarga (2/5 width) */}
        <div className="col-span-2">
          <div className="sticky top-6">
            <RecargaOptions />
          </div>
        </div>
      </section>
    </div>
  );
}
