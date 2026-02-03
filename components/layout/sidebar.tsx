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
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-sm"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Overlay (Mobile) */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-card border-r border-border z-40 transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'w-64 flex flex-col',
          className
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-primary">SOFHIA</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-6">
            {menuItems.map((section) => (
              <div key={section.title}>
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
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
        <div className="p-4 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <div className="font-semibold mb-1">SOFHIA Enterprise</div>
            <div>v0.2.0 (MVP)</div>
          </div>
        </div>
      </aside>
    </>
  );
}
