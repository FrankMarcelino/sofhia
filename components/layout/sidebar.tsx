'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bot,
  Database,
  Sparkles,
  DollarSign,
  Settings,
  BarChart3,
  FileText,
  Headphones,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const menuItems = [
  {
    title: 'Principal',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Atendimento',
        href: '/atendimento',
        icon: Headphones,
      },
      {
        label: 'Monitoramento',
        href: '/monitoramento',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Neurocore (IA)',
    items: [
      {
        label: 'Editor de Agente',
        href: '/neurocore/editor',
        icon: Bot,
      },
      {
        label: 'Base de Conhecimento',
        href: '/neurocore/base',
        icon: Database,
      },
      {
        label: 'Simulador',
        href: '/neurocore/simulador',
        icon: Sparkles,
      },
    ],
  },
  {
    title: 'Gestão',
    items: [
      {
        label: 'Clientes',
        href: '/clientes',
        icon: Users,
      },
      {
        label: 'Conversas',
        href: '/conversas',
        icon: MessageSquare,
      },
      {
        label: 'Relatórios',
        href: '/relatorios',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      {
        label: 'Carteira',
        href: '/financeiro',
        icon: DollarSign,
      },
    ],
  },
  {
    title: 'Configurações',
    items: [
      {
        label: 'Parâmetros',
        href: '/parametros',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen w-64 flex flex-col',
        'bg-[#1e293b] border-r border-[#334155]',
        'z-40', // Z-index para sidebar sempre visível
        className
      )}
    >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-[#334155] px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white">SOFHIA</span>
              <span className="text-[10px] text-emerald-400 font-medium -mt-1">AI-Driven System</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <div className="space-y-6">
            {menuItems.map((section) => (
              <div key={section.title}>
                <h3 className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                          isActive
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#334155]">
          {/* Upgrade Card */}
          <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wide">
                Upgrade to Pro
              </span>
            </div>
            <p className="text-xs text-emerald-50 mb-3 leading-relaxed">
              Get advanced AI features and unlimited conversations
            </p>
            <button className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg transition-colors">
              Upgrade Now
            </button>
          </div>

          {/* Version Info */}
          <div className="px-3 py-2 text-[11px] text-slate-400">
            <div className="font-semibold mb-0.5 text-slate-300">SOFHIA Enterprise</div>
            <div>v0.5.0 (UI Modernization)</div>
          </div>
        </div>
      </aside>
  );
}
