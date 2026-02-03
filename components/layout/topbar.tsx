'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bell, LogOut, Wallet, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';

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

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  atendimento: 'Atendimento',
  monitoramento: 'Monitoramento',
  neurocore: 'Neurocore',
  editor: 'Editor de Agente',
  base: 'Base de Conhecimento',
  simulador: 'Simulador',
  clientes: 'Clientes',
  conversas: 'Conversas',
  relatorios: 'Relatórios',
  financeiro: 'Financeiro',
  parametros: 'Parâmetros',
};

export function Topbar({ user, empresa }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
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

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
    href: '/' + pathSegments.slice(0, index + 1).join('/'),
  }));

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-border px-6 flex items-center justify-between shadow-sm">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3 flex-1">
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <Link
                href={crumb.href}
                className={index === breadcrumbs.length - 1
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground transition-colors'
                }
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets, agents, or reports..."
            className="w-full h-10 pl-10 pr-4 bg-muted border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Saldo */}
        {empresa && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <div className="text-sm">
              <div className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Saldo</div>
              <div className="font-bold text-emerald-700 -mt-0.5">
                {formatCurrency(empresa.saldo)}
              </div>
            </div>
          </div>
        )}

        {/* Notificações */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-muted"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="hidden lg:block text-right">
            <div className="text-sm font-semibold text-foreground">
              {user?.nome}
            </div>
            <div className="text-xs text-muted-foreground">
              {empresa?.nome_fantasia}
            </div>
          </div>
          
          <Avatar className="h-10 w-10 border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors">
            <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-700 text-white font-bold">
              {user?.nome?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={loading}
            title="Sair"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
