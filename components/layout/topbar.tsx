'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bell, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface TopbarProps {
  user?: {
    id: string;
    nome: string;
    email: string;
  };
  empresa?: {
    id: string;
    nome_fantasia: string;
    saldo: number;
  };
}

export function Topbar({ user, empresa }: TopbarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Left: Empty space for mobile menu button */}
      <div className="lg:hidden w-10" />

      {/* Center: Company name (mobile only) */}
      <div className="lg:hidden flex-1 text-center">
        <span className="text-sm font-semibold text-foreground">
          {empresa?.nome_fantasia}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Saldo (Desktop) */}
        {empresa && (
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="text-xs text-muted-foreground">Saldo</div>
              <div className="font-bold text-foreground">
                {formatCurrency(empresa.saldo)}
              </div>
            </div>
          </div>
        )}

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="hidden lg:block text-right">
            <div className="text-sm font-medium text-foreground">
              {user?.nome}
            </div>
            <div className="text-xs text-muted-foreground">
              {empresa?.nome_fantasia}
            </div>
          </div>
          
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">
              {user?.nome?.charAt(0).toUpperCase()}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={loading}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
