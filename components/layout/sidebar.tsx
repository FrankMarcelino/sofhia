'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Bot,
  Database,
  DollarSign,
  Settings,
  BarChart3,
  FileText,
  Headphones,
  Sparkles,
  ChevronRight,
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

  // Seção ativa = a que contém a rota atual
  const activeSectionIndex = useMemo(() => {
    return menuItems.findIndex((section) =>
      section.items.some((item) => pathname.startsWith(item.href))
    );
  }, [pathname]);

  const [openSections, setOpenSections] = useState<Set<number>>(() => {
    return new Set(activeSectionIndex >= 0 ? [activeSectionIndex] : [0]);
  });

  const toggleSection = (index: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        'flex-shrink-0 w-64 h-screen flex flex-col',
        'bg-[#1e293b] border-r border-[#334155]',
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
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((section, sectionIndex) => {
              const isOpen = openSections.has(sectionIndex);
              const hasActiveItem = section.items.some((item) =>
                pathname.startsWith(item.href)
              );

              return (
                <div key={section.title}>
                  <button
                    onClick={() => toggleSection(sectionIndex)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors duration-200',
                      hasActiveItem
                        ? 'text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    <span>{section.title}</span>
                    <ChevronRight
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        isOpen && 'rotate-90'
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="space-y-1 pt-1 pb-2">
                      {section.items.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
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
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#334155]">
          <div className="px-3 py-2 text-[11px] text-slate-400">
            <div className="font-semibold mb-0.5 text-slate-300">SOFHIA Enterprise</div>
            <div>v0.5.0 (UI Modernization)</div>
          </div>
        </div>
      </aside>
  );
}
